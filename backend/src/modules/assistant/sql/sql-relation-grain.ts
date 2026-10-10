import { parse } from 'pgsql-parser';

type AstRecord = Record<string, unknown>;

/** 참여·팀 편성의 조회 단위는 대표 행 하나이며, ID·시각도 그 대표 행의 값이다. */
const PERSON_GRAIN_KEYS: Record<string, string> = {
  schedule_participants: 'schedule_id',
  team_members: 'team_id',
};

const TARGET_ALIAS = 'grain_target';

/**
 * 검증을 통과한 테이블을 대표 행만 담은 관계로 바꾼 뒤 원래 JOIN을 실행한다.
 * 바깥 WHERE에서 제거하면 외부 JOIN이 보존해야 할 행도 사라지므로 관계 내부에서 제한한다.
 * (일정, 멤버) 인덱스를 사용하며 전체 테이블을 GROUP BY로 집계하지 않는다.
 *
 * @param {AstRecord} ast - 검증을 통과한 SELECT AST
 */
export async function normalizeRelationGrain(ast: AstRecord): Promise<void> {
  const tables: AstRecord[] = [];
  const usedAliases = new Set<string>();
  // 원래 테이블만 수집해 서버가 붙인 내부 테이블을 다시 변환하지 않는다.
  walk(ast, node => {
    if (isRecord(node.RangeVar) && PERSON_GRAIN_KEYS[String(node.RangeVar.relname)]) tables.push(node);
    if (typeof node.aliasname === 'string') usedAliases.add(node.aliasname);
  });

  let duplicateAliasNumber = 0;
  for (const node of tables) {
    const table = node.RangeVar as AstRecord;
    const tableName = table.relname as string;
    const aliasRecord = table.alias as AstRecord;
    const alias = aliasRecord.aliasname as string;
    let duplicateAlias: string;
    do {
      duplicateAlias = `grain_dup_${duplicateAliasNumber++}`;
    } while (usedAliases.has(duplicateAlias));
    usedAliases.add(duplicateAlias);

    const subquery = await createRepresentativeRelation(tableName, PERSON_GRAIN_KEYS[tableName], alias, duplicateAlias);
    delete node.RangeVar;
    node.RangeSubselect = { subquery: { SelectStmt: subquery }, alias: aliasRecord, lateral: false };
  }
}

async function createRepresentativeRelation(table: string, key: string, alias: string, duplicateAlias: string): Promise<AstRecord> {
  const sql = `SELECT * FROM ${table} AS ${TARGET_ALIAS} WHERE NOT EXISTS (SELECT 1 FROM ${table} AS ${duplicateAlias} WHERE ${duplicateAlias}.${key} = ${TARGET_ALIAS}.${key} AND ${duplicateAlias}.band_member_id = ${TARGET_ALIAS}.band_member_id AND ${duplicateAlias}.id < ${TARGET_ALIAS}.id)`;
  const wrapper = (await parse(sql)) as unknown as { stmts: { stmt: { SelectStmt: AstRecord } }[] };
  const select = wrapper.stmts[0].stmt.SelectStmt;
  // 원래 별칭은 AST에 설정해 인용된 식별자도 그대로 보존한다.
  walk(select, node => {
    if (isRecord(node.RangeVar) && isRecord(node.RangeVar.alias) && node.RangeVar.alias.aliasname === TARGET_ALIAS) {
      node.RangeVar.alias.aliasname = alias;
    }
    if (!isRecord(node.ColumnRef) || !Array.isArray(node.ColumnRef.fields)) return;
    const [first] = node.ColumnRef.fields as unknown[];
    if (isRecord(first) && isRecord(first.String) && first.String.sval === TARGET_ALIAS) first.String.sval = alias;
  });
  return select;
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
