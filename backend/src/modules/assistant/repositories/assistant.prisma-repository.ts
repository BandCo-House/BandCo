import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import type { SqlQueryRow } from '../sql/generated-sql.type';

import type { AssistantRepository } from './assistant.repository';

const MAX_RESULT_ROWS = 50;
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
    const boundedSql = `SELECT * FROM (${sql}) AS assistant_result LIMIT ${MAX_RESULT_ROWS}`;

    return tx.$queryRawUnsafe<SqlQueryRow[]>(boundedSql, bandId, ...parameters);
  }
}
