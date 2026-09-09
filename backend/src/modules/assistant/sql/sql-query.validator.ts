import { Injectable } from '@nestjs/common';
import { deparse, parse } from 'pgsql-parser';

import {
  type RawGeneratedSql,
  type RawSqlParameter,
  SQL_PARAMETER_TYPES,
  type SqlParameter,
  type SqlParameterType,
  type ValidatedSqlQuery,
} from './generated-sql.type';
import { SQL_ALLOWED_FUNCTIONS, SQL_CATALOG, SQL_CATALOG_JOINS, SQL_ENUM_COLUMNS, SQL_REQUIRED_RELATIONS } from './sql-catalog';

const MAX_SQL_LENGTH = 8_000;
const MAX_INTENT_LENGTH = 120;
const MAX_PARAMETERS = 8;
const MAX_PARAMETER_VALUE_LENGTH = 200;

const FORBIDDEN_NODE_TAGS = new Set([
  'AlterTableStmt',
  'CallStmt',
  'CopyStmt',
  'CreateStmt',
  'CreateTableAsStmt',
  'DeleteStmt',
  'DoStmt',
  'DropStmt',
  'GrantStmt',
  'InsertStmt',
  'LockStmt',
  'MergeStmt',
  'TransactionStmt',
  'TruncateStmt',
  'UpdateStmt',
  'VariableSetStmt',
]);

const ALLOWED_CAST_TYPES = new Set(['bool', 'date', 'float8', 'int4', 'int8', 'numeric', 'text', 'timestamptz', 'uuid']);
const ALLOWED_SQL_VALUE_FUNCTIONS = new Set(['SVFOP_CURRENT_DATE', 'SVFOP_CURRENT_TIMESTAMP']);

type AstRecord = Record<string, unknown>;

interface ColumnReference {
  alias: string;
  column: string;
}

interface AstAnalysis {
  aliases: Map<string, string>;
  outputAliases: Set<string>;
  parameterNumbers: Set<number>;
  columnNodes: AstRecord[];
  expressionNodes: AstRecord[];
  selectNodes: AstRecord[];
  joinNodes: AstRecord[];
  bandScopeRoots: Set<string>;
  softDeleteAliases: Set<string>;
  relationEdges: Array<[string, string]>;
}

/** LLM이 DB로 답할 수 없다고 분류한 질문이다. */
export class UnsupportedQuestionError extends Error {
  constructor(readonly reason: string) {
    super(reason);
    this.name = 'UnsupportedQuestionError';
  }
}

/** SQL이 실행 허용 조건을 통과하지 못했을 때 재생성에 사용할 오류다. */
export class InvalidSqlQueryError extends Error {
  constructor(
    readonly code: string,
    detail: string,
  ) {
    super(`${code}: ${detail}`);
    this.name = 'InvalidSqlQueryError';
  }
}

@Injectable()
export class SqlQueryValidator {
  /**
   * 구조화 응답과 PostgreSQL AST를 모두 검증하고 실행 가능한 쿼리로 변환한다.
   * JSON Schema는 형태만 보장하므로 실제 테이블·컬럼·권한 범위는 여기서 다시 확인한다.
   *
   * @param {unknown} raw - LLM 구조화 응답
   * @returns {Promise<ValidatedSqlQuery>} 검증되고 canonical SQL로 변환된 쿼리
   */
  async validate(raw: unknown): Promise<ValidatedSqlQuery> {
    const generated = parseGeneratedSql(raw);

    if (generated.status === 'UNSUPPORTED') {
      const reason = generated.unsupportedReason?.trim() || '밴드 데이터로 답할 수 없는 질문입니다.';
      throw new UnsupportedQuestionError(reason);
    }

    const parameters = parseParameters(generated.params);
    const ast = await parseSql(generated.sql);
    const analysis = analyzeAst(ast);

    validateParameterReferences(analysis.parameterNumbers, generated.params);
    validateColumnReferences(analysis.columnNodes, analysis.aliases, analysis.outputAliases);
    validateEnumParameterComparisons(analysis.expressionNodes, analysis.aliases);
    validateBandScopeAndRelations(analysis);

    return {
      intent: generated.intent.trim(),
      sql: await deparse(ast),
      parameters,
    };
  }
}

/** 구조화 응답의 필수 필드와 길이를 검증한다. */
function parseGeneratedSql(raw: unknown): RawGeneratedSql {
  if (!isRecord(raw)) {
    throw new InvalidSqlQueryError('INVALID_RESPONSE', 'LLM 응답이 객체가 아닙니다.');
  }

  const status = raw.status;
  const intent = raw.intent;
  const sql = raw.sql;
  const params = raw.params;
  const unsupportedReason = raw.unsupportedReason;

  if (status !== 'QUERY' && status !== 'UNSUPPORTED') {
    throw new InvalidSqlQueryError('INVALID_STATUS', 'status는 QUERY 또는 UNSUPPORTED여야 합니다.');
  }

  if (typeof intent !== 'string' || intent.trim() === '' || intent.length > MAX_INTENT_LENGTH) {
    throw new InvalidSqlQueryError('INVALID_INTENT', `intent는 1자 이상 ${MAX_INTENT_LENGTH}자 이하여야 합니다.`);
  }

  if (typeof sql !== 'string' || sql.length > MAX_SQL_LENGTH) {
    throw new InvalidSqlQueryError('INVALID_SQL', `sql은 문자열이며 ${MAX_SQL_LENGTH}자 이하여야 합니다.`);
  }

  if (!Array.isArray(params)) {
    throw new InvalidSqlQueryError('INVALID_PARAMETERS', 'params는 배열이어야 합니다.');
  }

  if (unsupportedReason !== null && typeof unsupportedReason !== 'string') {
    throw new InvalidSqlQueryError('INVALID_UNSUPPORTED_REASON', 'unsupportedReason은 문자열 또는 null이어야 합니다.');
  }

  if (status === 'QUERY' && sql.trim() === '') {
    throw new InvalidSqlQueryError('EMPTY_SQL', 'QUERY 응답에는 SQL이 필요합니다.');
  }

  return {
    status,
    intent,
    sql,
    params: params as RawSqlParameter[],
    unsupportedReason,
  };
}

/** 파라미터 위치·타입·값을 확인하고 Prisma에 바인딩할 값으로 변환한다. */
function parseParameters(rawParameters: RawSqlParameter[]): Array<string | number | boolean> {
  if (rawParameters.length > MAX_PARAMETERS) {
    throw new InvalidSqlQueryError('TOO_MANY_PARAMETERS', `파라미터는 최대 ${MAX_PARAMETERS}개까지 허용합니다.`);
  }

  return rawParameters.map((raw, index) => {
    if (!isRecord(raw)) {
      throw new InvalidSqlQueryError('INVALID_PARAMETER', `${index + 1}번째 파라미터가 객체가 아닙니다.`);
    }

    const expectedPosition = index + 2;

    if (raw.position !== expectedPosition) {
      throw new InvalidSqlQueryError('INVALID_PARAMETER_POSITION', `파라미터 위치는 ${expectedPosition}이어야 합니다.`);
    }

    if (typeof raw.type !== 'string' || !SQL_PARAMETER_TYPES.includes(raw.type as SqlParameterType)) {
      throw new InvalidSqlQueryError('INVALID_PARAMETER_TYPE', `${expectedPosition}번 파라미터 타입을 허용하지 않습니다.`);
    }

    if (typeof raw.value !== 'string' || raw.value.length > MAX_PARAMETER_VALUE_LENGTH) {
      throw new InvalidSqlQueryError('INVALID_PARAMETER_VALUE', `${expectedPosition}번 파라미터 값이 올바르지 않습니다.`);
    }

    return convertParameter({ position: raw.position, type: raw.type as SqlParameterType, value: raw.value });
  });
}

/** 파라미터 선언 타입에 맞게 런타임 값을 변환한다. */
function convertParameter(parameter: SqlParameter): string | number | boolean {
  if (parameter.type === 'INTEGER') {
    if (!/^-?\d+$/.test(parameter.value)) {
      throw new InvalidSqlQueryError('INVALID_INTEGER_PARAMETER', `${parameter.position}번 값은 정수여야 합니다.`);
    }

    const parsed = Number(parameter.value);

    if (!Number.isSafeInteger(parsed)) {
      throw new InvalidSqlQueryError('INVALID_INTEGER_PARAMETER', `${parameter.position}번 정수가 안전 범위를 벗어났습니다.`);
    }

    return parsed;
  }

  if (parameter.type === 'BOOLEAN') {
    if (parameter.value !== 'true' && parameter.value !== 'false') {
      throw new InvalidSqlQueryError('INVALID_BOOLEAN_PARAMETER', `${parameter.position}번 값은 true 또는 false여야 합니다.`);
    }

    return parameter.value === 'true';
  }

  if (parameter.type === 'DATE' && !/^\d{4}-\d{2}-\d{2}$/.test(parameter.value)) {
    throw new InvalidSqlQueryError('INVALID_DATE_PARAMETER', `${parameter.position}번 날짜는 YYYY-MM-DD 형식이어야 합니다.`);
  }

  if (parameter.type === 'TIMESTAMPTZ' && Number.isNaN(Date.parse(parameter.value))) {
    throw new InvalidSqlQueryError('INVALID_TIMESTAMP_PARAMETER', `${parameter.position}번 시각을 해석할 수 없습니다.`);
  }

  return parameter.value;
}

/** 실제 PostgreSQL parser로 문법을 확인한다. */
async function parseSql(sql: string): Promise<AstRecord> {
  try {
    return (await parse(sql)) as unknown as AstRecord;
  } catch {
    throw new InvalidSqlQueryError('SQL_PARSE_FAILED', 'PostgreSQL 문법으로 파싱할 수 없습니다.');
  }
}

/** AST를 순회하며 실행 허용 여부 판단에 필요한 정보를 모은다. */
function analyzeAst(ast: AstRecord): AstAnalysis {
  const statements = Array.isArray(ast.stmts) ? ast.stmts : [];

  if (statements.length !== 1) {
    throw new InvalidSqlQueryError('SINGLE_STATEMENT_REQUIRED', 'SQL은 정확히 한 문장이어야 합니다.');
  }

  const statement = getNestedRecord(statements[0], ['stmt']);

  if (statement === null || !isRecord(statement.SelectStmt)) {
    throw new InvalidSqlQueryError('SELECT_ONLY', 'SELECT 문만 실행할 수 있습니다.');
  }

  const analysis: AstAnalysis = {
    aliases: new Map(),
    outputAliases: new Set(),
    parameterNumbers: new Set(),
    columnNodes: [],
    expressionNodes: [],
    selectNodes: [],
    joinNodes: [],
    bandScopeRoots: new Set(),
    softDeleteAliases: new Set(),
    relationEdges: [],
  };

  walkAst(ast, (tag, node, ancestors) => {
    if (FORBIDDEN_NODE_TAGS.has(tag)) {
      throw new InvalidSqlQueryError('WRITE_STATEMENT_BLOCKED', `${tag} 노드는 사용할 수 없습니다.`);
    }

    if (tag === 'SelectStmt') validateSelectNode(node, analysis);
    if (tag === 'RangeVar') collectTableReference(node, analysis.aliases);
    if (tag === 'RangeSubselect' || tag === 'RangeFunction') {
      throw new InvalidSqlQueryError('RANGE_SOURCE_BLOCKED', `${tag}는 사용할 수 없습니다.`);
    }
    if (tag === 'ColumnRef') analysis.columnNodes.push(node);
    if (tag === 'A_Expr') analysis.expressionNodes.push(node);
    if (tag === 'ResTarget' && typeof node.name === 'string') analysis.outputAliases.add(node.name);
    if (tag === 'ParamRef') collectParameterNumber(node, analysis.parameterNumbers);
    if (tag === 'FuncCall') validateFunctionCall(node);
    if (tag === 'TypeName') validateCastType(node);
    if (tag === 'SQLValueFunction') validateSqlValueFunction(node);
    if (tag === 'A_Const' && isRecord(node.sval)) {
      throw new InvalidSqlQueryError('STRING_LITERAL_BLOCKED', '문자열 값은 파라미터로 분리해야 합니다.');
    }
    if (tag === 'A_Star' && !ancestors.includes('FuncCall')) {
      throw new InvalidSqlQueryError('SELECT_STAR_BLOCKED', 'SELECT *는 사용할 수 없습니다.');
    }
    if (tag === 'JoinExpr') analysis.joinNodes.push(node);
  });

  if (analysis.selectNodes.length === 0) {
    throw new InvalidSqlQueryError('SELECT_ONLY', 'SELECT 문이 없습니다.');
  }

  collectScopeAndRelations(analysis);

  return analysis;
}

/** SELECT 내부의 쓰기·집합 연산·CTE를 차단한다. */
function validateSelectNode(node: AstRecord, analysis: AstAnalysis): void {
  if (node.op !== undefined && node.op !== 'SETOP_NONE') {
    throw new InvalidSqlQueryError('SET_OPERATION_BLOCKED', 'UNION, INTERSECT, EXCEPT는 사용할 수 없습니다.');
  }

  if (node.withClause !== undefined) {
    throw new InvalidSqlQueryError('CTE_BLOCKED', 'WITH 절은 MVP에서 사용할 수 없습니다.');
  }

  if (node.intoClause !== undefined) {
    throw new InvalidSqlQueryError('SELECT_INTO_BLOCKED', 'SELECT INTO는 사용할 수 없습니다.');
  }

  if (Array.isArray(node.lockingClause) && node.lockingClause.length > 0) {
    throw new InvalidSqlQueryError('ROW_LOCK_BLOCKED', '행 잠금 SELECT는 사용할 수 없습니다.');
  }

  analysis.selectNodes.push(node);
}

/** 물리 테이블과 별칭이 catalog 안에 있는지 확인한다. */
function collectTableReference(node: AstRecord, aliases: Map<string, string>): void {
  if (typeof node.schemaname === 'string' || typeof node.catalogname === 'string') {
    throw new InvalidSqlQueryError('QUALIFIED_TABLE_BLOCKED', '스키마를 직접 지정할 수 없습니다.');
  }

  if (typeof node.relname !== 'string' || SQL_CATALOG[node.relname] === undefined) {
    throw new InvalidSqlQueryError('TABLE_NOT_ALLOWED', `허용되지 않은 테이블입니다: ${String(node.relname)}`);
  }

  const aliasRecord = isRecord(node.alias) ? node.alias : null;
  const alias = aliasRecord?.aliasname;

  if (typeof alias !== 'string' || alias === '') {
    throw new InvalidSqlQueryError('TABLE_ALIAS_REQUIRED', `${node.relname} 테이블에 별칭이 필요합니다.`);
  }

  if (aliases.has(alias)) {
    throw new InvalidSqlQueryError('DUPLICATE_TABLE_ALIAS', `테이블 별칭이 중복됐습니다: ${alias}`);
  }

  aliases.set(alias, node.relname);
}

/** 허용된 집계·문자열·날짜 함수만 통과시킨다. */
function validateFunctionCall(node: AstRecord): void {
  const names = readStringNodeArray(node.funcname);

  if (names.length !== 1 || !SQL_ALLOWED_FUNCTIONS.has(names[0].toLowerCase())) {
    throw new InvalidSqlQueryError('FUNCTION_NOT_ALLOWED', `허용되지 않은 함수입니다: ${names.join('.') || 'unknown'}`);
  }
}

/** 안전한 결과 변환과 파라미터 비교에 필요한 cast만 허용한다. */
function validateCastType(node: AstRecord): void {
  const names = readStringNodeArray(node.names);
  const castType = names.at(-1)?.toLowerCase();

  if (castType === undefined || !ALLOWED_CAST_TYPES.has(castType)) {
    throw new InvalidSqlQueryError('CAST_NOT_ALLOWED', `허용되지 않은 형 변환입니다: ${names.join('.')}`);
  }
}

/** 현재 날짜·시각 외의 세션 정보 함수는 결과 노출을 막기 위해 제외한다. */
function validateSqlValueFunction(node: AstRecord): void {
  if (typeof node.op !== 'string' || !ALLOWED_SQL_VALUE_FUNCTIONS.has(node.op)) {
    throw new InvalidSqlQueryError('SQL_VALUE_FUNCTION_NOT_ALLOWED', `허용되지 않은 SQL 값 함수입니다: ${String(node.op)}`);
  }
}

/** AST가 참조한 파라미터와 구조화 응답의 params가 정확히 일치하는지 확인한다. */
function validateParameterReferences(parameterNumbers: Set<number>, parameters: RawSqlParameter[]): void {
  const expected = new Set([1, ...parameters.map(parameter => parameter.position)]);

  if (parameterNumbers.size !== expected.size || [...expected].some(position => !parameterNumbers.has(position))) {
    throw new InvalidSqlQueryError('PARAMETER_MISMATCH', 'SQL 파라미터 위치와 params가 일치하지 않습니다.');
  }
}

/** 모든 컬럼을 테이블 별칭과 함께 명시하고 catalog 컬럼만 사용했는지 확인한다. */
function validateColumnReferences(columnNodes: AstRecord[], aliases: Map<string, string>, outputAliases: Set<string>): void {
  for (const node of columnNodes) {
    const fields = readColumnFields(node);

    if (fields.includes('*')) {
      throw new InvalidSqlQueryError('SELECT_STAR_BLOCKED', 'SELECT *는 사용할 수 없습니다.');
    }

    if (fields.length === 1 && outputAliases.has(fields[0])) {
      continue;
    }

    if (fields.length !== 2) {
      throw new InvalidSqlQueryError('QUALIFIED_COLUMN_REQUIRED', `컬럼은 별칭과 함께 사용해야 합니다: ${fields.join('.')}`);
    }

    const [alias, column] = fields;
    const tableName = aliases.get(alias);

    if (tableName === undefined) {
      throw new InvalidSqlQueryError('UNKNOWN_TABLE_ALIAS', `알 수 없는 테이블 별칭입니다: ${alias}`);
    }

    if (SQL_CATALOG[tableName].columns[column] === undefined) {
      throw new InvalidSqlQueryError('COLUMN_NOT_ALLOWED', `허용되지 않은 컬럼입니다: ${tableName}.${column}`);
    }
  }
}

/** PostgreSQL enum 컬럼은 TEXT 파라미터와 비교하기 전에 명시적으로 text로 변환해야 한다. */
function validateEnumParameterComparisons(expressionNodes: AstRecord[], aliases: Map<string, string>): void {
  for (const expression of expressionNodes) {
    assertEnumColumnCast(expression.lexpr, expression.rexpr, aliases);
    assertEnumColumnCast(expression.rexpr, expression.lexpr, aliases);
  }
}

/** 한쪽이 enum 컬럼이고 반대쪽에 파라미터가 있으면 컬럼의 ::text 변환 여부를 확인한다. */
function assertEnumColumnCast(columnValue: unknown, parameterValue: unknown, aliases: Map<string, string>): void {
  if (!hasParameterReference(parameterValue)) {
    return;
  }

  const comparableColumn = readComparableColumn(columnValue);

  if (comparableColumn === null) {
    return;
  }

  const tableName = aliases.get(comparableColumn.column.alias);

  if (tableName === undefined) {
    return;
  }

  const catalogColumn = `${tableName}.${comparableColumn.column.column}`;

  if (SQL_ENUM_COLUMNS.has(catalogColumn) && !comparableColumn.castToText) {
    const parameterNumber = findFirstParameterNumber(parameterValue);
    const comparisonExample =
      parameterNumber === null
        ? ''
        : ` ${comparableColumn.column.alias}.${comparableColumn.column.column}::text = $${parameterNumber} 형태로 수정해야 합니다.`;

    throw new InvalidSqlQueryError('ENUM_CAST_REQUIRED', `${catalogColumn}은 ::text 변환 후 파라미터와 비교해야 합니다.${comparisonExample}`);
  }
}

/** 비교식의 컬럼 참조와 text cast 여부를 읽는다. */
function readComparableColumn(value: unknown): { column: ColumnReference; castToText: boolean } | null {
  const directColumn = readColumnReference(value);

  if (directColumn !== null) {
    return { column: directColumn, castToText: false };
  }

  const typeCast = getTaggedNode(value, 'TypeCast');

  if (typeCast === null) {
    return null;
  }

  const castColumn = readColumnReference(typeCast.arg);
  const typeName = isRecord(typeCast.typeName) ? typeCast.typeName : null;
  const castType = typeName === null ? null : readStringNodeArray(typeName.names).at(-1)?.toLowerCase();

  return castColumn === null ? null : { column: castColumn, castToText: castType === 'text' };
}

/** 비교식 반대편에 바인딩 파라미터가 포함됐는지 확인한다. */
function hasParameterReference(value: unknown): boolean {
  let found = false;

  walkAst(value, tag => {
    if (tag === 'ParamRef') {
      found = true;
    }
  });

  return found;
}

/** 검증 실패 피드백에 구체적인 수정 예를 넣기 위해 첫 파라미터 번호를 찾는다. */
function findFirstParameterNumber(value: unknown): number | null {
  let parameterNumber: number | null = null;

  walkAst(value, (tag, node) => {
    if (tag === 'ParamRef' && parameterNumber === null && typeof node.number === 'number') {
      parameterNumber = node.number;
    }
  });

  return parameterNumber;
}

/** 밴드 범위와 soft-delete 조건을 찾고 허용 관계로 연결된 별칭 그래프를 만든다. */
function collectScopeAndRelations(analysis: AstAnalysis): void {
  for (const selectNode of analysis.selectNodes) {
    const conditions = getDirectAndConditions(selectNode.whereClause);
    collectConditions(conditions, analysis);
  }

  for (const joinNode of analysis.joinNodes) {
    const conditions = getDirectAndConditions(joinNode.quals);
    collectConditions(conditions, analysis);
  }
}

/** 직접 AND 조건에서 범위, 삭제, JOIN 조건을 수집한다. */
function collectConditions(conditions: unknown[], analysis: AstAnalysis): void {
  for (const condition of conditions) {
    const expression = getTaggedNode(condition, 'A_Expr');

    if (expression !== null && readOperator(expression) === '=') {
      const leftColumn = readColumnReference(expression.lexpr);
      const rightColumn = readColumnReference(expression.rexpr);
      const leftParameter = readUuidParameterNumber(expression.lexpr);
      const rightParameter = readUuidParameterNumber(expression.rexpr);

      collectBandScope(leftColumn, rightParameter, analysis);
      collectBandScope(rightColumn, leftParameter, analysis);

      if (leftColumn !== null && rightColumn !== null && isAllowedJoin(leftColumn, rightColumn, analysis.aliases)) {
        analysis.relationEdges.push([leftColumn.alias, rightColumn.alias]);
      }
    }

    const nullTest = getTaggedNode(condition, 'NullTest');

    if (nullTest !== null && nullTest.nulltesttype === 'IS_NULL') {
      const column = readColumnReference(nullTest.arg);

      if (column !== null && column.column === 'deleted_at') {
        analysis.softDeleteAliases.add(column.alias);
      }
    }
  }
}

/** bands.id = $1 조건을 밴드 범위 루트로 기록한다. */
function collectBandScope(column: ColumnReference | null, parameterNumber: number | null, analysis: AstAnalysis): void {
  if (column === null || parameterNumber !== 1 || column.column !== 'id') {
    return;
  }

  if (analysis.aliases.get(column.alias) === 'bands') {
    analysis.bandScopeRoots.add(column.alias);
  }
}

/** 모든 조회 테이블이 범위가 고정된 bands 별칭에서 허용 JOIN으로 이어지는지 확인한다. */
function validateBandScopeAndRelations(analysis: AstAnalysis): void {
  if (analysis.bandScopeRoots.size === 0) {
    throw new InvalidSqlQueryError('BAND_SCOPE_MISSING', 'WHERE 최상위 AND 조건에 bands.id = $1::uuid가 필요합니다.');
  }

  for (const [alias, tableName] of analysis.aliases) {
    if ((tableName === 'bands' || tableName === 'users' || tableName === 'band_spaces') && !analysis.softDeleteAliases.has(alias)) {
      throw new InvalidSqlQueryError('SOFT_DELETE_SCOPE_MISSING', `${alias}.deleted_at IS NULL 조건이 필요합니다.`);
    }
  }

  const reachable = new Set(analysis.bandScopeRoots);
  let changed = true;

  while (changed) {
    changed = false;

    for (const [leftAlias, rightAlias] of analysis.relationEdges) {
      if (reachable.has(leftAlias) && !reachable.has(rightAlias)) {
        reachable.add(rightAlias);
        changed = true;
      }

      if (reachable.has(rightAlias) && !reachable.has(leftAlias)) {
        reachable.add(leftAlias);
        changed = true;
      }
    }
  }

  const disconnected = [...analysis.aliases.keys()].filter(alias => !reachable.has(alias));

  if (disconnected.length > 0) {
    throw new InvalidSqlQueryError('TABLE_OUTSIDE_BAND_SCOPE', `밴드에서 허용 JOIN으로 연결되지 않은 별칭입니다: ${disconnected.join(', ')}`);
  }

  validateRequiredRelations(analysis);
}

/** 중간 테이블이 우회 경로가 아니라 의미상 필요한 양쪽 관계에 직접 연결됐는지 확인한다. */
function validateRequiredRelations(analysis: AstAnalysis): void {
  for (const [alias, tableName] of analysis.aliases) {
    const requiredTables = SQL_REQUIRED_RELATIONS[tableName] ?? [];
    const neighbors = analysis.relationEdges.flatMap(([leftAlias, rightAlias]) => {
      if (leftAlias === alias) {
        return [rightAlias];
      }

      return rightAlias === alias ? [leftAlias] : [];
    });
    const neighborTables = new Set(neighbors.map(neighborAlias => analysis.aliases.get(neighborAlias)));
    const missingTables = requiredTables.filter(requiredTable => !neighborTables.has(requiredTable));

    if (missingTables.length > 0) {
      throw new InvalidSqlQueryError(
        'REQUIRED_RELATION_MISSING',
        `${tableName} 별칭 ${alias}에 필요한 직접 관계가 없습니다: ${missingTables.join(', ')}`,
      );
    }
  }
}

/** 두 컬럼이 catalog에 정의된 관계인지 확인한다. */
function isAllowedJoin(left: ColumnReference, right: ColumnReference, aliases: Map<string, string>): boolean {
  const leftTable = aliases.get(left.alias);
  const rightTable = aliases.get(right.alias);

  if (leftTable === undefined || rightTable === undefined) {
    return false;
  }

  const leftKey = `${leftTable}.${left.column}`;
  const rightKey = `${rightTable}.${right.column}`;

  return SQL_CATALOG_JOINS.some(join => (join.left === leftKey && join.right === rightKey) || (join.left === rightKey && join.right === leftKey));
}

/** AND 최상위 조건만 펼쳐 OR 안에 숨긴 범위 조건을 인정하지 않는다. */
function getDirectAndConditions(value: unknown): unknown[] {
  const boolExpression = getTaggedNode(value, 'BoolExpr');

  if (boolExpression !== null && boolExpression.boolop === 'AND_EXPR' && Array.isArray(boolExpression.args)) {
    return boolExpression.args;
  }

  return value === undefined ? [] : [value];
}

/** AST 전체를 순회한다. */
function walkAst(value: unknown, visitor: (tag: string, node: AstRecord, ancestors: string[]) => void, ancestors: string[] = []): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      walkAst(item, visitor, ancestors);
    }

    return;
  }

  if (!isRecord(value)) {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    if (isRecord(child)) {
      visitor(key, child, ancestors);
      walkAst(child, visitor, [...ancestors, key]);
      continue;
    }

    walkAst(child, visitor, ancestors);
  }
}

function collectParameterNumber(node: AstRecord, target: Set<number>): void {
  if (typeof node.number === 'number' && Number.isInteger(node.number)) {
    target.add(node.number);
  }
}

function readOperator(node: AstRecord): string | null {
  const names = readStringNodeArray(node.name);

  return names.length === 1 ? names[0] : null;
}

function readColumnReference(value: unknown): ColumnReference | null {
  const node = getTaggedNode(value, 'ColumnRef');

  if (node === null) {
    return null;
  }

  const fields = readColumnFields(node);

  return fields.length === 2 && !fields.includes('*') ? { alias: fields[0], column: fields[1] } : null;
}

function readUuidParameterNumber(value: unknown): number | null {
  const typeCast = getTaggedNode(value, 'TypeCast');

  if (typeCast === null || !isRecord(typeCast.typeName)) {
    return null;
  }

  const castType = readStringNodeArray(typeCast.typeName.names).at(-1)?.toLowerCase();
  const parameter = getTaggedNode(typeCast.arg, 'ParamRef');

  return castType === 'uuid' && parameter !== null && typeof parameter.number === 'number' ? parameter.number : null;
}

function readColumnFields(node: AstRecord): string[] {
  if (!Array.isArray(node.fields)) {
    return [];
  }

  return node.fields.flatMap(field => {
    const stringNode = getTaggedNode(field, 'String');

    if (stringNode !== null && typeof stringNode.sval === 'string') {
      return [stringNode.sval];
    }

    return getTaggedNode(field, 'A_Star') === null ? [] : ['*'];
  });
}

function readStringNodeArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(item => {
    const stringNode = getTaggedNode(item, 'String');

    return stringNode !== null && typeof stringNode.sval === 'string' ? [stringNode.sval] : [];
  });
}

function getTaggedNode(value: unknown, tag: string): AstRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const node = value[tag];

  return isRecord(node) ? node : null;
}

function getNestedRecord(value: unknown, path: string[]): AstRecord | null {
  let current: unknown = value;

  for (const key of path) {
    if (!isRecord(current)) {
      return null;
    }

    current = current[key];
  }

  return isRecord(current) ? current : null;
}

function isRecord(value: unknown): value is AstRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
