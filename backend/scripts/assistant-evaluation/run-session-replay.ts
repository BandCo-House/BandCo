import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';

import { PrismaService } from '../../src/database/prisma';
import type { Prisma } from '../../src/generated/prisma';

import { readEvaluationDatabaseUrl, readEvaluationOutputPath } from './evaluation-environment';

const participantCountsSql = `SELECT COUNT(sp.id)::int AS row_count,
  COUNT(DISTINCT sp.band_member_id)::int AS person_count
  FROM schedule_participants sp WHERE sp.schedule_id = exp_uuid('target-schedule-63')`;
const teamCountsSql = `SELECT COUNT(tm.id)::int AS row_count,
  COUNT(DISTINCT tm.band_member_id)::int AS person_count
  FROM team_members tm WHERE tm.team_id = exp_uuid('target-team-1')`;

class RollbackFixture extends Error {}

/**
 * 같은 사람의 세션 행만 늘려 집계 차이를 관측한다. 트랜잭션을 되돌려 50문항 데이터는 보존한다.
 */
async function main(): Promise<void> {
  process.env.DATABASE_URL = readEvaluationDatabaseUrl(process.env.ASSISTANT_EVALUATION_DATABASE_URL);
  const outputPath = readEvaluationOutputPath(
    process.env.EXPERIMENT_OUTPUT_PATH,
    execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim(),
  );
  if (!outputPath || existsSync(outputPath)) throw new Error('새 EXPERIMENT_OUTPUT_PATH가 필요합니다.');
  const prisma = new PrismaService();
  const readCounts = async (client: Prisma.TransactionClient) => ({
    participants: await client.$queryRawUnsafe(participantCountsSql),
    teamMembers: await client.$queryRawUnsafe(teamCountsSql),
  });
  let observation: { before: unknown; after: unknown } | undefined;
  try {
    try {
      await prisma.$transaction(async tx => {
        const before = await readCounts(tx);
        await tx.$executeRawUnsafe(`UPDATE schedule_participants SET skill_type_id = exp_uuid('skill-guitar')
          WHERE schedule_id = exp_uuid('target-schedule-63') AND band_member_id = exp_uuid('target-member-1')`);
        await tx.$executeRawUnsafe(`INSERT INTO schedule_participants (id, schedule_id, band_member_id, skill_type_id, attendance_status, updated_at)
          SELECT exp_uuid('hypothesis-session-participant'), schedule_id, band_member_id, exp_uuid('skill-vocal'), attendance_status, updated_at
          FROM schedule_participants WHERE schedule_id = exp_uuid('target-schedule-63') AND band_member_id = exp_uuid('target-member-1')`);
        await tx.$executeRawUnsafe(`UPDATE team_members SET skill_type_id = exp_uuid('skill-guitar')
          WHERE team_id = exp_uuid('target-team-1') AND band_member_id = exp_uuid('target-member-1')`);
        await tx.$executeRawUnsafe(`INSERT INTO team_members (id, team_id, band_member_id, skill_type_id, joined_at, team_role)
          SELECT exp_uuid('hypothesis-session-team-member'), team_id, band_member_id, exp_uuid('skill-vocal'), joined_at, team_role
          FROM team_members WHERE team_id = exp_uuid('target-team-1') AND band_member_id = exp_uuid('target-member-1')`);
        observation = { before, after: await readCounts(tx) };
        throw new RollbackFixture();
      });
    } catch (error) {
      if (!(error instanceof RollbackFixture)) throw error;
    }
    const restored = await prisma.$transaction(readCounts);
    if (!observation || JSON.stringify(restored) !== JSON.stringify(observation.before)) throw new Error('실험 fixture 복원을 확인하지 못했습니다.');
    const payload = {
      hypothesis: 'H-SESSIONS',
      inputsHash: createHash('sha256')
        .update(participantCountsSql + teamCountsSql)
        .digest('hex'),
      observation,
      restored,
      fixtureRolledBack: true,
    };
    writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : '세션 집계 검증 실패'}\n`);
  process.exitCode = 1;
});
