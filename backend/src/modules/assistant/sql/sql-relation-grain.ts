import { parse } from 'pgsql-parser';

type AstRecord = Record<string, unknown>;

/**
 * 참여·팀 편성은 세션 단위로 저장돼 겸업 멤버가 같은 일정·팀에 여러 행을 가진다.
 * 모델에게 허용한 컬럼은 모두 사람 단위라서 서버가 (일정, 멤버)·(팀, 멤버)당 한 행으로 바꿔 실행한다.
 * 세션 컬럼(skill_type_id)을 카탈로그에 추가하면 아래 서브쿼리에 없어 실행 오류로 드러난다.
 */
const PERSON_GRAIN_SUBQUERIES: Record<string, string> = {
  schedule_participants:
    'SELECT MIN(id::text)::uuid AS id, schedule_id, band_member_id, attendance_status, MAX(updated_at) AS updated_at FROM schedule_participants GROUP BY schedule_id, band_member_id, attendance_status',
  team_members:
    'SELECT MIN(id::text)::uuid AS id, team_id, band_member_id, MIN(joined_at) AS joined_at, team_role FROM team_members GROUP BY team_id, band_member_id, team_role',
};

/**
 * 검증을 통과한 AST의 세션 단위 테이블을 사람 단위 서브쿼리로 바꾼다.
 * 별칭과 컬럼 이름이 같아 바깥 조건·JOIN·밴드 범위는 그대로 적용된다.
 *
 * @param {AstRecord} ast - 검증을 통과한 SELECT AST
 */
export async function normalizeRelationGrain(ast: AstRecord): Promise<void> {
  const subqueries = new Map<string, AstRecord>();

  for (const [table, sql] of Object.entries(PERSON_GRAIN_SUBQUERIES)) {
    const wrapper = (await parse(`SELECT 1 FROM (${sql}) AS grain`)) as unknown as { stmts: { stmt: { SelectStmt: { fromClause: AstRecord[] } } }[] };
    subqueries.set(table, wrapper.stmts[0].stmt.SelectStmt.fromClause[0]);
  }

  replaceTables(ast, subqueries);
}

function replaceTables(value: unknown, subqueries: Map<string, AstRecord>): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const replacement = toPersonGrain(item, subqueries);
      if (replacement) value[index] = replacement;
      else replaceTables(item, subqueries);
    });
    return;
  }
  if (!isRecord(value)) return;

  for (const [key, child] of Object.entries(value)) {
    const replacement = toPersonGrain(child, subqueries);
    if (replacement) value[key] = replacement;
    else replaceTables(child, subqueries);
  }
}

function toPersonGrain(node: unknown, subqueries: Map<string, AstRecord>): AstRecord | null {
  if (!isRecord(node) || !isRecord(node.RangeVar) || typeof node.RangeVar.relname !== 'string') return null;
  const subquery = subqueries.get(node.RangeVar.relname);
  if (!subquery) return null;

  const replacement = structuredClone(subquery);
  (replacement.RangeSubselect as AstRecord).alias = structuredClone(node.RangeVar.alias);
  return replacement;
}

function isRecord(value: unknown): value is AstRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
