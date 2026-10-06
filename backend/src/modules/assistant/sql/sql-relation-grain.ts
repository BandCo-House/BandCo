import { parse } from 'pgsql-parser';

type AstRecord = Record<string, unknown>;

/**
 * 참여·팀 편성은 세션 단위로 저장돼 겸업 멤버가 같은 일정·팀에 여러 행을 가진다.
 * 모델에게 허용한 컬럼은 모두 사람 단위라서 서버가 (일정, 멤버)·(팀, 멤버)마다 id가 가장 작은 행만 남겨 실행한다.
 * 일정을 회의로 바꿀 때 멤버당 id 오름차순 첫 행을 남기는 기존 규칙과 같은 대표 행이다.
 */
const PERSON_GRAIN_KEYS: Record<string, string> = {
  schedule_participants: 'schedule_id',
  team_members: 'team_id',
};

const TARGET_ALIAS = 'grain_target';

/**
 * 검증을 통과한 AST에서 세션 단위 테이블을 쓰는 SELECT마다 대표 행 조건을 WHERE에 더한다.
 * (일정, 멤버) 인덱스로 같은 사람의 다른 세션 행만 확인하므로 테이블 전체를 집계하지 않는다.
 * LEFT JOIN으로 비어 있는 행은 NOT EXISTS가 참이라 그대로 남는다.
 *
 * @param {AstRecord} ast - 검증을 통과한 SELECT AST
 */
export async function normalizeRelationGrain(ast: AstRecord): Promise<void> {
  const selects: AstRecord[] = [];
  const usedAliases = new Set<string>();
  walk(ast, node => {
    if (isRecord(node.SelectStmt)) selects.push(node.SelectStmt);
    if (typeof node.aliasname === 'string') usedAliases.add(node.aliasname);
  });

  let duplicateAliasNumber = 0;
  for (const select of selects) {
    for (const { table, alias } of collectFromTables(select.fromClause)) {
      const key = PERSON_GRAIN_KEYS[table];
      if (!key) continue;
      let duplicateAlias: string;
      do {
        duplicateAlias = `grain_dup_${duplicateAliasNumber++}`;
      } while (usedAliases.has(duplicateAlias));
      usedAliases.add(duplicateAlias);
      const condition = await createRepresentativeRowCondition(table, key, alias, duplicateAlias);
      appendAndCondition(select, condition);
    }
  }
}

async function createRepresentativeRowCondition(table: string, key: string, alias: string, duplicateAlias: string): Promise<AstRecord> {
  const sql = `SELECT 1 FROM ${table} AS ${TARGET_ALIAS} WHERE NOT EXISTS (SELECT 1 FROM ${table} AS ${duplicateAlias} WHERE ${duplicateAlias}.${key} = ${TARGET_ALIAS}.${key} AND ${duplicateAlias}.band_member_id = ${TARGET_ALIAS}.band_member_id AND ${duplicateAlias}.id < ${TARGET_ALIAS}.id)`;
  const wrapper = (await parse(sql)) as unknown as { stmts: { stmt: { SelectStmt: { whereClause: AstRecord } } }[] };
  const condition = wrapper.stmts[0].stmt.SelectStmt.whereClause;
  // 별칭은 문자열에 넣지 않고 AST에서 바꿔 식별자 인용 문제를 피한다.
  walk(condition, node => {
    if (!isRecord(node.ColumnRef) || !Array.isArray(node.ColumnRef.fields)) return;
    const [first] = node.ColumnRef.fields as unknown[];
    if (isRecord(first) && isRecord(first.String) && first.String.sval === TARGET_ALIAS) first.String.sval = alias;
  });
  return condition;
}

/** 바깥 조건을 읽는 코드가 직접 AND 조건으로 계속 다룰 수 있게 기존 AND에 이어 붙인다. */
function appendAndCondition(select: AstRecord, condition: AstRecord): void {
  const where = select.whereClause;
  if (isRecord(where) && isRecord(where.BoolExpr) && where.BoolExpr.boolop === 'AND_EXPR' && Array.isArray(where.BoolExpr.args)) {
    where.BoolExpr.args.push(condition);
    return;
  }
  select.whereClause = where ? { BoolExpr: { boolop: 'AND_EXPR', args: [where, condition] } } : condition;
}

/** SELECT 자신의 FROM·JOIN에 있는 테이블만 찾는다. JOIN 조건 안의 하위 SELECT는 따로 처리된다. */
function collectFromTables(value: unknown): Array<{ table: string; alias: string }> {
  if (Array.isArray(value)) return value.flatMap(collectFromTables);
  if (!isRecord(value)) return [];
  if (isRecord(value.JoinExpr)) return [...collectFromTables(value.JoinExpr.larg), ...collectFromTables(value.JoinExpr.rarg)];
  if (isRecord(value.RangeVar) && typeof value.RangeVar.relname === 'string') {
    const alias = isRecord(value.RangeVar.alias) ? value.RangeVar.alias.aliasname : value.RangeVar.relname;
    return typeof alias === 'string' ? [{ table: value.RangeVar.relname, alias }] : [];
  }
  return [];
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
