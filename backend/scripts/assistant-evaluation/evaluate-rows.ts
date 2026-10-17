import { parse } from 'pgsql-parser';

import { Prisma } from '../../src/generated/prisma';

export const EVALUATOR_VERSION = '3.2.0';

export interface EvaluationColumn {
  key: string;
  type: 'text' | 'decimal' | 'timestamp';
}

export interface EvaluationContract {
  goldSql: string;
  columns: EvaluationColumn[];
  orderSensitive?: boolean;
  tiePolicy?: 'one' | 'one-or-all';
}

interface Projection {
  key: string;
  meaning: string;
}

type RecordValue = Record<string, unknown>;

/**
 * 결과값을 보고 컬럼을 추측하면 서로 바뀐 값도 정답이 된다. SQL의 출력 의미로 먼저 대응시킨다.
 *
 * @param contract - 실행 전에 고정한 문항별 비교 규칙
 * @param expectedRows - 기대 쿼리의 원시 행
 * @param actualRows - 서버 제한을 적용한 실제 행
 * @param actualSql - 실제 출력 별칭과 의미를 확인할 생성 SQL
 * @returns 결과 일치 여부와 판정 근거
 */
export async function evaluateRows(contract: EvaluationContract, expectedRows: RecordValue[], actualRows: RecordValue[], actualSql: string) {
  const expectedProjection = await readProjection(contract.goldSql);
  const actualProjection = await readProjection(actualSql);
  const mapping = contract.columns.map(column => {
    const expected = expectedProjection.find(projection => projection.key === column.key);
    const matches = actualProjection.filter(projection => projection.meaning !== '' && projection.meaning === expected?.meaning);
    return matches.length === 1 ? matches[0].key : null;
  });

  const hasAmbiguousColumns = mapping.some(key => key === null) || new Set(mapping).size !== mapping.length;
  if (hasAmbiguousColumns || actualProjection.length !== contract.columns.length) {
    return { matches: false, reason: 'COLUMN_MAPPING_FAILED' };
  }

  try {
    const expected = normalizeRows(
      expectedRows,
      contract.columns,
      contract.columns.map(column => column.key),
    );
    const actual = normalizeRows(actualRows, contract.columns, mapping as string[]);

    if (contract.tiePolicy !== undefined && expected.length > 0) {
      const isOneWinner = actual.length === 1 && expected.includes(actual[0]);
      const isAllWinners = contract.tiePolicy === 'one-or-all' && sameRows(expected, actual, false);
      return { matches: isOneWinner || isAllWinners, reason: 'TIED_WINNERS' };
    }

    const matches = sameRows(expected, actual, contract.orderSensitive ?? false);
    return { matches, reason: matches ? 'MATCH' : 'ROW_MISMATCH' };
  } catch {
    return { matches: false, reason: 'INVALID_RESULT_TYPE' };
  }
}

function normalizeRows(rows: RecordValue[], columns: EvaluationColumn[], keys: string[]): string[] {
  return rows.map(row => {
    if (Object.keys(row).length !== columns.length) throw new Error('출력 컬럼 수가 다릅니다.');
    return JSON.stringify(columns.map((column, index) => normalizeValue(row[keys[index]], column.type)));
  });
}

function normalizeValue(value: unknown, type: EvaluationColumn['type']): string | null {
  if (value === null) return null;
  if (type === 'text') {
    if (typeof value !== 'string') throw new Error('문자열 컬럼입니다.');
    return value;
  }
  if (type === 'timestamp') {
    const date = value instanceof Date ? value : new Date(String(value));
    return date.toISOString();
  }
  if (typeof value === 'number' && (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER)) {
    throw new Error('정밀도를 확인할 수 없는 숫자입니다.');
  }
  if (typeof value !== 'number' && typeof value !== 'string' && typeof value !== 'bigint' && !Prisma.Decimal.isDecimal(value)) {
    throw new Error('숫자 컬럼입니다.');
  }
  const decimal = new Prisma.Decimal(String(value));
  if (!decimal.isFinite()) throw new Error('유한한 숫자가 아닙니다.');
  return decimal.toFixed();
}

function sameRows(expected: string[], actual: string[], orderSensitive: boolean): boolean {
  const expectedOrder = orderSensitive ? expected : [...expected].sort();
  const actualOrder = orderSensitive ? actual : [...actual].sort();
  return JSON.stringify(expectedOrder) === JSON.stringify(actualOrder);
}

async function readProjection(sql: string): Promise<Projection[]> {
  const ast = (await parse(sql)) as unknown as { stmts: { stmt: { SelectStmt: RecordValue } }[] };
  const select = ast.stmts[0].stmt.SelectStmt;
  const aliases = new Map<string, string>();
  collectTableAliases(select.fromClause, aliases);
  const targets = select.targetList as { ResTarget: { name?: string; val: RecordValue } }[];
  return targets.map(({ ResTarget: target }) => ({
    key: target.name ?? defaultOutputName(target.val),
    meaning: expressionMeaning(target.val, aliases),
  }));
}

function collectTableAliases(value: unknown, aliases: Map<string, string>): void {
  if (Array.isArray(value)) {
    value.forEach(item => collectTableAliases(item, aliases));
    return;
  }
  if (!isRecord(value)) return;
  if (isRecord(value.RangeVar)) {
    const table = value.RangeVar;
    const alias = isRecord(table.alias) ? table.alias.aliasname : table.relname;
    if (typeof alias === 'string' && typeof table.relname === 'string') aliases.set(alias, table.relname);
  }
  // 서버의 대표 관계는 물리 컬럼을 그대로 투영한다. 계산·변경된 파생 컬럼은 추정하지 않는다.
  if (isRecord(value.RangeSubselect)) {
    const derived = value.RangeSubselect;
    const select = isRecord(derived.subquery) && isRecord(derived.subquery.SelectStmt) ? derived.subquery.SelectStmt : null;
    const from = Array.isArray(select?.fromClause) ? select.fromClause : [];
    const targets = Array.isArray(select?.targetList) ? select.targetList : [];
    const target = isRecord(targets[0]) && isRecord(targets[0].ResTarget) ? targets[0].ResTarget : null;
    const fields = target && isRecord(target.val) && isRecord(target.val.ColumnRef) ? target.val.ColumnRef.fields : null;
    const isStar = Array.isArray(fields) && fields.length === 1 && isRecord(fields[0]) && isRecord(fields[0].A_Star);
    const source = isRecord(from[0]) && isRecord(from[0].RangeVar) ? from[0].RangeVar : null;
    const alias = isRecord(derived.alias) ? derived.alias.aliasname : null;
    if (targets.length === 1 && isStar && from.length === 1 && typeof source?.relname === 'string' && typeof alias === 'string') {
      aliases.set(alias, source.relname);
    }
  }
  if (isRecord(value.JoinExpr)) {
    collectTableAliases(value.JoinExpr.larg, aliases);
    collectTableAliases(value.JoinExpr.rarg, aliases);
  }
}

function expressionMeaning(value: RecordValue, aliases: Map<string, string>): string {
  if (isRecord(value.TypeCast) && isRecord(value.TypeCast.arg)) return expressionMeaning(value.TypeCast.arg, aliases);
  if (isRecord(value.ColumnRef)) {
    const parts = readNames(value.ColumnRef.fields);
    if (parts.length === 2 && aliases.has(parts[0])) return `${aliases.get(parts[0])}.${parts[1]}`;
    return '';
  }
  if (isRecord(value.FuncCall)) {
    const name = readNames(value.FuncCall.funcname).at(-1);
    const args = value.FuncCall.args;
    if (name === 'round' && Array.isArray(args) && isRecord(args[0])) return expressionMeaning(args[0], aliases);
    // 집계 인자 차이는 결과로 판별하되, 서로 다른 집계 컬럼이 여러 개면 위에서 대응을 거절한다.
    if (name === 'count' || name === 'avg' || name === 'sum' || name === 'min' || name === 'max') return `aggregate:${name}`;
  }
  return '';
}

function defaultOutputName(value: RecordValue): string {
  if (isRecord(value.TypeCast) && isRecord(value.TypeCast.arg)) return defaultOutputName(value.TypeCast.arg);
  if (isRecord(value.ColumnRef)) return readNames(value.ColumnRef.fields).at(-1) ?? '';
  if (isRecord(value.FuncCall)) return readNames(value.FuncCall.funcname).at(-1) ?? '';
  return '';
}

function readNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (isRecord(item) && isRecord(item.String) && typeof item.String.sval === 'string') return [item.String.sval];
    return [];
  });
}

function isRecord(value: unknown): value is RecordValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
