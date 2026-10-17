import { parse } from 'pgsql-parser';

import type { ValidatedSqlQuery } from './generated-sql.type';

type AstRecord = Record<string, unknown>;
export interface ArtistNameBinding {
  position: number;
  value: string;
}

/** 이름의 equality에만 쓰이는 파라미터를 찾는다. OR·LIKE·공유 값의 의미를 자동으로 바꾸지 않는다. */
export async function readArtistNameBindings(query: ValidatedSqlQuery): Promise<ArtistNameBinding[]> {
  const ast = (await parse(query.sql)) as unknown as { stmts: Array<{ stmt: { SelectStmt: AstRecord } }> };
  const select = ast.stmts[0].stmt.SelectStmt;
  const aliases = new Set<string>();
  const collect = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(collect);
    if (!isRecord(value)) return;
    if (isRecord(value.RangeVar) && value.RangeVar.relname === 'songs') {
      const alias = isRecord(value.RangeVar.alias) ? value.RangeVar.alias.aliasname : 'songs';
      if (typeof alias === 'string') aliases.add(alias);
    }
    if (isRecord(value.JoinExpr)) {
      collect(value.JoinExpr.larg);
      collect(value.JoinExpr.rarg);
    }
  };
  collect(select.fromClause);
  if (aliases.size === 0) return [];

  const bindings: ArtistNameBinding[] = [];
  const read = (value: unknown): void => {
    if (!isRecord(value)) return;
    if (isRecord(value.BoolExpr) && value.BoolExpr.boolop === 'AND_EXPR' && Array.isArray(value.BoolExpr.args)) {
      value.BoolExpr.args.forEach(read);
      return;
    }
    const expression = value.A_Expr;
    if (!isRecord(expression) || expression.kind !== 'AEXPR_OP' || readNames(expression.name).join('.') !== '=') return;
    const pairs = [
      [expression.lexpr, expression.rexpr],
      [expression.rexpr, expression.lexpr],
    ];
    for (const [left, right] of pairs) {
      const column = unwrapCast(left)?.ColumnRef;
      const parts = isRecord(column) ? readNames(column.fields) : [];
      const parameter = unwrapCast(right)?.ParamRef;
      if (parts.length !== 2 || !aliases.has(parts[0]) || parts[1] !== 'artist_name' || !isRecord(parameter)) continue;
      const position = parameter.number;
      const boundValue = typeof position === 'number' ? query.parameters[position - 2] : undefined;
      if (
        typeof position === 'number' &&
        position >= 2 &&
        query.parameterTypes?.[position - 2] === 'TEXT' &&
        typeof boundValue === 'string' &&
        boundValue.trim() !== ''
      ) {
        bindings.push({ position, value: boundValue });
      }
    }
  };
  read(select.whereClause);
  return bindings.filter((binding, index) => {
    const matching = bindings.filter(other => other.position === binding.position).length;
    return bindings.findIndex(other => other.position === binding.position) === index && countReferences(select, binding.position) === matching;
  });
}

/** 이름을 데이터로 확인한다. 후보가 잘리거나 모호하면 선택을 요청하고 임의로 고르지 않는다. */
export function resolveArtistName(
  value: string,
  question: string,
  candidates: string[],
): { name: string } | { candidates: string[]; hasMore: boolean } {
  const normalized = value.toLowerCase();
  const insensitive = candidates.filter(name => name.toLowerCase() === normalized);
  const exact = candidates.find(name => name === value) ?? (insensitive.length === 1 ? insensitive[0] : undefined);
  const quotes = [
    ['"', '"'],
    ["'", "'"],
    ['“', '”'],
    ['‘', '’'],
  ];
  const isQuoted = (name: string): boolean => quotes.some(([open, close]) => question.toLowerCase().includes(`${open}${name.toLowerCase()}${close}`));
  if (exact && isQuoted(exact)) return { name: exact };
  if (!exact && candidates.length > 0 && isQuoted(value)) return { candidates: candidates.slice(0, 5), hasMore: candidates.length > 5 };
  if (candidates.length > 5) return { candidates: candidates.slice(0, 5), hasMore: true };
  const mentioned = candidates.filter(name => question.toLowerCase().includes(name.toLowerCase()));
  const fullNames = mentioned.filter(name => !mentioned.some(other => other !== name && other.toLowerCase().includes(name.toLowerCase())));
  if (fullNames.length === 1) return { name: fullNames[0] };
  if (exact) return { name: exact };
  if (candidates.length <= 1) return { name: candidates[0] ?? value };
  return { candidates, hasMore: false };
}

/**
 * 후보를 누르면 바로 보낼 질문을 만든다. 따옴표로 감싼 정확한 이름은 resolveArtistName에서 그 이름으로 확정된다.
 * 질문에 모델이 읽은 이름이 없으면 원래 질문 뒤에 후보를 덧붙인다.
 */
export function createCandidateQuestion(question: string, value: string, candidate: string): string {
  const quoted = `'${candidate}'`;
  for (const [open, close] of [
    ["'", "'"],
    ['"', '"'],
    ['‘', '’'],
    ['“', '”'],
  ]) {
    if (question.includes(`${open}${value}${close}`)) return question.replace(`${open}${value}${close}`, quoted);
  }
  if (value !== '' && question.includes(value)) return question.replace(value, quoted);
  return `${question} (아티스트 ${quoted})`;
}

function unwrapCast(value: unknown): AstRecord | null {
  if (!isRecord(value)) return null;
  if (!isRecord(value.TypeCast)) return value;
  const type = value.TypeCast.typeName;
  return isRecord(type) && readNames(type.names).at(-1) === 'text' ? unwrapCast(value.TypeCast.arg) : null;
}

function countReferences(value: unknown, position: number): number {
  if (Array.isArray(value)) return value.reduce((count, item) => count + countReferences(item, position), 0);
  if (!isRecord(value)) return 0;
  if (isRecord(value.ParamRef)) return value.ParamRef.number === position ? 1 : 0;
  return Object.values(value).reduce<number>((count, item) => count + countReferences(item, position), 0);
}

function readNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => (isRecord(item) && isRecord(item.String) && typeof item.String.sval === 'string' ? [item.String.sval] : []));
}

function isRecord(value: unknown): value is AstRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
