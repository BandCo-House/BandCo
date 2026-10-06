import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { PrismaService } from '../../src/database/prisma';
import { AssistantPrismaRepository } from '../../src/modules/assistant/repositories/assistant.prisma-repository';
import { SqlQueryValidator } from '../../src/modules/assistant/sql/sql-query.validator';

import { readEvaluationDatabaseUrl, readEvaluationOutputPath } from './evaluation-environment';

const BAND_ID = '11111111-1111-4111-8111-111111111111';
const genreSql = `SELECT COUNT(fg.id)::int AS member_count
  FROM bands b JOIN band_members bm ON bm.band_id = b.id
  JOIN users u ON u.id = bm.user_id JOIN favor_genres fg ON fg.user_id = u.id
  JOIN genres g ON g.id = fg.genre_id
  WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND g.name = $2`;
const leaderSql = `SELECT up.nickname FROM bands b JOIN teams t ON t.band_id = b.id
  JOIN band_members bm ON bm.id = t.team_leader_band_member_id
  JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id
  WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND t.name = $2`;

/** 모델의 변동을 배제하고 고정 SQL의 허용 여부와 실행 결과를 기록한다. */
async function main(): Promise<void> {
  process.env.DATABASE_URL = readEvaluationDatabaseUrl(process.env.ASSISTANT_EVALUATION_DATABASE_URL);
  const outputPath = readEvaluationOutputPath(
    process.env.EXPERIMENT_OUTPUT_PATH,
    execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim(),
  );
  if (!outputPath || existsSync(outputPath)) throw new Error('새 EXPERIMENT_OUTPUT_PATH가 필요합니다.');
  const prisma = new PrismaService();
  const repository = new AssistantPrismaRepository(prisma);
  const validator = new SqlQueryValidator();
  const cases = [
    { id: 'valid-genre', sql: genreSql, value: '록' },
    { id: 'obsolete-genre', sql: genreSql.replaceAll('favor_genres', 'favorite_genres'), value: '록' },
    { id: 'valid-leader', sql: leaderSql, value: '보컬팀' },
    { id: 'leader-without-scope', sql: leaderSql.replace('b.id = $1::uuid AND ', ''), value: '보컬팀' },
    {
      id: 'leader-or-scope',
      sql: leaderSql.replace('b.id = $1::uuid AND b.deleted_at IS NULL', '(b.id = $1::uuid OR b.deleted_at IS NULL)'),
      value: '보컬팀',
    },
    {
      id: 'leader-unscoped-subquery',
      sql: leaderSql.replace(
        'SELECT up.nickname',
        'SELECT (SELECT up2.nickname FROM users u2 JOIN user_profiles up2 ON up2.user_id = u2.id LIMIT 1) AS nickname',
      ),
      value: '보컬팀',
    },
  ];
  try {
    const results = [];
    for (const input of cases) {
      let databaseCalls = 0;
      try {
        const query = await validator.validate({
          status: 'QUERY',
          intent: input.id,
          sql: input.sql,
          params: [{ position: 2, type: 'TEXT', value: input.value }],
          unsupportedReason: null,
        });
        const rows = await prisma.$transaction(async tx => {
          await repository.configureReadOnlyTransaction(tx);
          databaseCalls += 1;
          return repository.executeGeneratedQuery(query.sql, query.parameters, BAND_ID, tx);
        });
        results.push({ id: input.id, validated: true, databaseCalls, rows });
      } catch (error) {
        const code = error instanceof Error && 'code' in error ? error.code : null;
        results.push({ id: input.id, validated: databaseCalls > 0, databaseCalls, code });
      }
    }
    const payload = {
      gitCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      catalogHash: createHash('sha256').update(readFileSync('src/modules/assistant/sql/sql-catalog.ts')).digest('hex'),
      inputsHash: createHash('sha256').update(JSON.stringify(cases)).digest('hex'),
      results,
    };
    writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : '고정 SQL 검증 실패'}\n`);
  process.exitCode = 1;
});
