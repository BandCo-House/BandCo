import { parse } from 'pgsql-parser';

import { Prisma } from '../../../generated/prisma';
import { MAX_ASSISTANT_RESULT_ROWS, type SqlQueryPage, type ValidatedSqlQuery } from '../sql/generated-sql.type';
import { SQL_CATALOG } from '../sql/sql-catalog';
import type { AssistantResultValue, AssistantTableResult } from '../types/assistant-answer.type';

type AstRecord = Record<string, unknown>;

const VALUE_LABELS: Record<string, string> = {
  PRACTICE: '합주',
  MEETING: '회의',
  PLANNED: '예정',
  DONE: '완료',
  CANCELED: '취소',
  ATTENDING: '참석',
  ABSENT: '불참',
  PENDING: '미응답',
  MEMBER: '일반 멤버',
};
const COLUMN_LABELS: Record<string, string> = {
  member_count: '멤버 수',
  attendance_count: '참석 횟수',
  participant_count: '대상 인원',
  practice_count: '편성 횟수',
  absent_count: '불참 인원',
  skill_name: '악기',
  title: '이름',
  nickname: '닉네임',
  start_at: '시작 시각',
  artist_name: '아티스트',
};

/** 조회 결과를 같은 SQL의 컬럼·조건과 연결하고 JSON 안전 값으로 변환한다. */
export async function mapSqlResult(query: ValidatedSqlQuery, page: SqlQueryPage): Promise<AssistantTableResult> {
  const ast: unknown = await parse(query.sql);
  const aliases = new Map<string, string>();
  const selects: AstRecord[] = [];
  walk(ast, node => {
    if (isRecord(node.RangeVar)) {
      const table = node.RangeVar;
      const alias = isRecord(table.alias) ? table.alias.aliasname : table.relname;
      if (typeof alias === 'string' && typeof table.relname === 'string') aliases.set(alias, table.relname);
    }
    if (isRecord(node.SelectStmt)) selects.push(node.SelectStmt);
  });
  const columns = (selects[0]?.targetList as Array<{ ResTarget: { name?: string; val: AstRecord } }>).map(({ ResTarget: target }) => {
    const key = target.name ?? outputName(target.val);
    return {
      key,
      label: COLUMN_LABELS[key] ?? columnLabel(target.val, aliases) ?? key,
      format: page.rows.some(row => row[key] instanceof Date) ? ('datetime' as const) : ('plain' as const),
    };
  });
  if (new Set(columns.map(column => column.key)).size !== columns.length) throw new Error('같은 이름의 결과 컬럼을 구분할 수 없습니다.');
  // 제외·존재 판정 내부의 조건을 결과 행의 필수 조건으로 오인하지 않는다.
  const conditions = selects.slice(0, 1).flatMap(select => {
    const condition = formatCondition(select.whereClause, aliases, query.parameters);
    return condition ? [condition] : [];
  });
  return {
    entity: 'table',
    columns,
    rows: page.rows.map(row => Object.fromEntries(columns.map(column => [column.key, serializeValue(row[column.key])]))),
    hasMore: page.hasMore,
    maxRows: MAX_ASSISTANT_RESULT_ROWS,
    resultMode: query.resultMode ?? 'LEGACY',
    conditions: [...new Set(conditions)],
  };
}

function serializeValue(value: unknown): AssistantResultValue {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint' || Prisma.Decimal.isDecimal(value)) return String(value);
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  throw new Error('지원하지 않는 결과 값입니다.');
}

/** 표시할 수 없는 OR 분기는 전체를 생략해 남은 분기가 필수 조건인 것처럼 보이지 않게 한다. */
function formatCondition(value: unknown, aliases: Map<string, string>, parameters: Array<string | number | boolean>): string | null {
  if (!isRecord(value)) return null;
  if (isRecord(value.BoolExpr) && Array.isArray(value.BoolExpr.args)) {
    const expression = value.BoolExpr;
    const children = (expression.args as unknown[]).map(arg => formatCondition(arg, aliases, parameters));
    if (expression.boolop !== 'AND_EXPR' && children.some(child => child === null)) return null;
    const visible = children.filter((child): child is string => child !== null);
    if (visible.length === 0) return null;
    if (expression.boolop === 'NOT_EXPR') return `(${visible.join(' 그리고 ')}) 제외`;
    return visible.length === 1 ? visible[0] : `(${visible.join(expression.boolop === 'OR_EXPR' ? ' 또는 ' : ' 그리고 ')})`;
  }
  if (isRecord(value.NullTest)) {
    const label = columnLabel(value.NullTest.arg, aliases);
    if (!label || isHiddenColumn(value.NullTest.arg)) return null;
    return `${label}: ${value.NullTest.nulltesttype === 'IS_NULL' ? '값 없음' : '값 있음'}`;
  }
  if (isRecord(value.A_Expr)) {
    const expression = value.A_Expr;
    const label = columnLabel(expression.lexpr, aliases);
    if (!label || isHiddenColumn(expression.lexpr)) return null;
    const parameter = readValue(expression.rexpr, parameters);
    if (parameter === undefined) return null;
    const operator = names(expression.name)[0];
    const operators: Record<string, string> = {
      '=': '같음',
      '<>': '제외',
      '!=': '제외',
      '>': '초과',
      '>=': '이상',
      '<': '미만',
      '<=': '이하',
      '~~*': '검색',
      '~~': '검색',
    };
    if (!operators[operator]) return null;
    const display = typeof parameter === 'boolean' ? (parameter ? '예' : '아니요') : (VALUE_LABELS[String(parameter)] ?? String(parameter));
    return `${label}: ${display} ${operators[operator]}`;
  }
  return null;
}

function readValue(value: unknown, parameters: Array<string | number | boolean>): string | number | boolean | undefined {
  if (!isRecord(value)) return undefined;
  if (isRecord(value.TypeCast)) return readValue(value.TypeCast.arg, parameters);
  if (isRecord(value.ParamRef) && typeof value.ParamRef.number === 'number' && value.ParamRef.number > 1)
    return parameters[value.ParamRef.number - 2];
  if (isRecord(value.A_Const)) {
    for (const key of ['sval', 'ival', 'boolval']) {
      const nested = value.A_Const[key];
      if (isRecord(nested)) {
        const raw = nested[key];
        if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') return raw;
      }
    }
  }
  return undefined;
}

function columnLabel(value: unknown, aliases: Map<string, string>): string | undefined {
  if (!isRecord(value)) return undefined;
  if (isRecord(value.TypeCast)) return columnLabel(value.TypeCast.arg, aliases);
  if (!isRecord(value.ColumnRef)) return undefined;
  const [alias, column] = names(value.ColumnRef.fields);
  const table = aliases.get(alias);
  return table ? SQL_CATALOG[table]?.columns[column] : undefined;
}

function isHiddenColumn(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (isRecord(value.TypeCast)) return isHiddenColumn(value.TypeCast.arg);
  return isRecord(value.ColumnRef) && ['id', 'band_id', 'deleted_at'].includes(names(value.ColumnRef.fields).at(-1) ?? '');
}

function outputName(value: AstRecord): string {
  if (isRecord(value.TypeCast) && isRecord(value.TypeCast.arg)) return outputName(value.TypeCast.arg);
  if (isRecord(value.ColumnRef)) return names(value.ColumnRef.fields).at(-1) ?? '?column?';
  if (isRecord(value.FuncCall)) return names(value.FuncCall.funcname).at(-1) ?? '?column?';
  return '?column?';
}

function names(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => (isRecord(item) && isRecord(item.String) && typeof item.String.sval === 'string' ? [item.String.sval] : []));
}

function walk(value: unknown, visit: (node: AstRecord) => void): void {
  if (Array.isArray(value)) value.forEach(item => walk(item, visit));
  else if (isRecord(value)) {
    visit(value);
    Object.values(value).forEach(item => walk(item, visit));
  }
}

function isRecord(value: unknown): value is AstRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
