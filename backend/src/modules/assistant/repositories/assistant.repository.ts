import type { Prisma } from '../../../generated/prisma';
import type { SqlQueryRow } from '../sql/generated-sql.type';

export const ASSISTANT_REPOSITORY = Symbol('ASSISTANT_REPOSITORY');

/** 자연어 질의가 사용하는 DB 경로를 멤버십 확인과 검증된 SELECT 실행으로 제한한다. */
export interface AssistantRepository {
  findBandMemberByBandIdAndUserId(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;
  configureReadOnlyTransaction(tx: Prisma.TransactionClient): Promise<void>;
  executeGeneratedQuery(
    sql: string,
    parameters: Array<string | number | boolean>,
    bandId: string,
    tx: Prisma.TransactionClient,
  ): Promise<SqlQueryRow[]>;
}
