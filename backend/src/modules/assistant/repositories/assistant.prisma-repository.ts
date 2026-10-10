import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import { MAX_ASSISTANT_RESULT_ROWS, type SqlQueryPage, type SqlQueryRow } from '../sql/generated-sql.type';
import type { AssistantQueryLogEntry } from '../telemetry/assistant-query-log.type';

import type { AssistantRepository } from './assistant.repository';

const STATEMENT_TIMEOUT_MS = 3_000;

@Injectable()
export class AssistantPrismaRepository implements AssistantRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** 인증 사용자가 삭제되지 않은 밴드의 멤버인지 확인한다. */
  async findBandMemberByBandIdAndUserId(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null> {
    const client = tx ?? this.prisma;

    return client.bandMember.findFirst({
      where: { userId, band: { id: bandId, deletedAt: null } },
      select: { id: true },
    });
  }

  /**
   * 검증을 통과했더라도 DB 권한을 한 번 더 제한한다.
   * statement timeout은 같은 밴드 안에서 지나치게 비싼 SELECT가 생성된 경우를 중단한다.
   */
  async configureReadOnlyTransaction(tx: Prisma.TransactionClient): Promise<void> {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = '${STATEMENT_TIMEOUT_MS}ms'`);
  }

  /** 질문에 나온 실제 이름과 정확 일치를 먼저 가져온다. 여섯 번째 후보는 잘림 감지용이다. */
  async findArtistNameCandidates(bandId: string, value: string, question: string, tx: Prisma.TransactionClient): Promise<string[]> {
    const rows = await tx.$queryRawUnsafe<Array<{ artist_name: string }>>(
      `SELECT so.artist_name FROM bands b JOIN songs so ON so.band_id = b.id
       WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND so.artist_name <> ''
         AND STRPOS(LOWER(so.artist_name), LOWER($2)) > 0
       GROUP BY so.artist_name
       ORDER BY CASE WHEN STRPOS(LOWER($3), LOWER(so.artist_name)) > 0 THEN LENGTH(so.artist_name) ELSE 0 END DESC,
                (LOWER(so.artist_name) = LOWER($2)) DESC, so.artist_name ASC
       LIMIT 6`,
      bandId,
      value,
      question,
    );
    return rows.map(row => row.artist_name);
  }

  /**
   * 서버 소유 밴드 ID를 $1에 두고 모델 파라미터를 $2부터 바인딩한다.
   * 외부 LIMIT으로 모델이 누락하거나 큰 값을 만든 경우에도 반환 행 수를 제한한다.
   */
  async executeGeneratedQuery(
    sql: string,
    parameters: Array<string | number | boolean>,
    bandId: string,
    tx: Prisma.TransactionClient,
  ): Promise<SqlQueryRow[]> {
    return (await this.executeGeneratedQueryPage(sql, parameters, bandId, tx)).rows;
  }

  /** 51번째 행의 존재를 확인하고, 사용자에게 전달할 행은 50개로 제한한다. */
  async executeGeneratedQueryPage(
    sql: string,
    parameters: Array<string | number | boolean>,
    bandId: string,
    tx: Prisma.TransactionClient,
  ): Promise<SqlQueryPage> {
    const boundedSql = `SELECT * FROM (${sql}) AS assistant_result LIMIT ${MAX_ASSISTANT_RESULT_ROWS + 1}`;
    const rows = await tx.$queryRawUnsafe<SqlQueryRow[]>(boundedSql, bandId, ...parameters);
    return { rows: rows.slice(0, MAX_ASSISTANT_RESULT_ROWS), hasMore: rows.length > MAX_ASSISTANT_RESULT_ROWS };
  }

  /**
   * 측정 기록을 남긴다. 조회와 같은 트랜잭션에 넣지 않는다.
   * 읽기 전용 트랜잭션에서는 쓸 수 없고, 기록 실패가 조회 결과를 되돌려서도 안 된다.
   */
  async recordQueryLog(entry: AssistantQueryLogEntry): Promise<void> {
    await this.prisma.assistantQueryLog.create({ data: entry });
  }
}
