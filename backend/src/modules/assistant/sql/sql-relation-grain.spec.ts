import { deparse, parse } from 'pgsql-parser';

import { normalizeRelationGrain } from './sql-relation-grain';

type AstRecord = Record<string, unknown>;
type SqlAst = { stmts: Array<{ stmt: { SelectStmt: AstRecord } }> };

async function readAst(sql: string): Promise<SqlAst> {
  return (await parse(sql)) as unknown as SqlAst;
}

function findNodes(value: unknown, tag: string): AstRecord[] {
  if (Array.isArray(value)) return value.flatMap(item => findNodes(item, tag));
  if (value === null || typeof value !== 'object') return [];
  const record = value as AstRecord;
  const tagged = record[tag];
  const matches = tagged !== null && typeof tagged === 'object' ? [tagged as AstRecord] : [];
  return [...matches, ...Object.values(record).flatMap(item => findNodes(item, tag))];
}

describe('사람 단위 관계 변환', () => {
  it.each(['LEFT', 'RIGHT', 'FULL', 'INNER'])('%s JOIN 이전에 대표 행을 고르고 바깥 ON·WHERE는 보존한다', async joinType => {
    const ast = await readAst(`SELECT sc.id, sp.id FROM schedules sc ${joinType} JOIN schedule_participants sp
      ON sp.schedule_id = sc.id AND sp.id = $2 WHERE sc.id = $1`);
    const original = structuredClone(ast);
    await normalizeRelationGrain(ast);
    const select = ast.stmts[0].stmt.SelectStmt;
    const join = findNodes(select, 'JoinExpr')[0];
    const originalJoin = findNodes(original, 'JoinExpr')[0];
    expect(select.whereClause).toEqual(original.stmts[0].stmt.SelectStmt.whereClause);
    expect(join.quals).toEqual(originalJoin.quals);
    expect(join.jointype).toBe(originalJoin.jointype);
    const relation = (join.rarg as { RangeSubselect: AstRecord }).RangeSubselect;
    expect(relation.alias).toEqual({ aliasname: 'sp' });
    expect(findNodes(relation, 'RangeVar').map(table => table.relname)).toEqual(['schedule_participants', 'schedule_participants']);
    expect(findNodes(relation, 'SubLink')).toHaveLength(1);
    expect(await deparse(ast)).toContain('grain_dup_0.id < sp.id');
  });

  it('중첩 JOIN의 양쪽 대상과 원래 하위 SELECT 모두에서 별칭 충돌을 피한다', async () => {
    const ast = await readAst(`SELECT grain_dup_0.id FROM (schedule_participants grain_dup_0 RIGHT JOIN schedules sc
      ON grain_dup_0.schedule_id = sc.id) LEFT JOIN team_members tm ON tm.band_member_id = grain_dup_0.band_member_id
      WHERE EXISTS (SELECT grain_dup_1.id FROM teams grain_dup_1 WHERE grain_dup_1.id = tm.team_id)`);
    const where = structuredClone(ast.stmts[0].stmt.SelectStmt.whereClause);
    await normalizeRelationGrain(ast);
    expect(ast.stmts[0].stmt.SelectStmt.whereClause).toEqual(where);
    expect(findNodes(ast, 'RangeSubselect')).toHaveLength(2);
    const sql = await deparse(ast);
    expect(sql).toContain('grain_dup_2.id < grain_dup_0.id');
    expect(sql).toContain('grain_dup_3.id < tm.id');
    expect(sql).not.toContain('grain_dup_0.id < grain_dup_0.id');
  });

  it('인용된 별칭과 하위 SELECT의 테이블도 원래 식별자를 유지한다', async () => {
    const ast = await readAst(`SELECT sc.id FROM schedules sc WHERE EXISTS (
      SELECT "참여 행".id FROM schedule_participants "참여 행" WHERE "참여 행".schedule_id = sc.id)`);
    await normalizeRelationGrain(ast);
    const relation = findNodes(ast, 'RangeSubselect')[0];
    expect(relation.alias).toEqual({ aliasname: '참여 행' });
    const source = findNodes(relation, 'RangeVar')[0];
    expect(source.alias).toEqual({ aliasname: '참여 행' });
    expect(await deparse(ast)).toContain('grain_dup_0.id < "참여 행".id');
  });

  it('대상 테이블이 없으면 원래 AST를 바꾸지 않는다', async () => {
    const ast = await readAst('SELECT sc.title FROM schedules sc WHERE sc.id = $1 LIMIT 1');
    const original = structuredClone(ast);
    await normalizeRelationGrain(ast);
    expect(ast).toEqual(original);
  });
});
