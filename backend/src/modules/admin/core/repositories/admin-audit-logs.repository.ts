import type { PaginationParams } from 'src/common/pagination';
import type { Prisma } from 'src/generated/prisma';

import type { AdminAuditLogFilter, AdminAuditLogListItem, RecordAdminAuditLogInput } from '../types/admin-audit.type';

export const ADMIN_AUDIT_LOGS_REPOSITORY = Symbol('ADMIN_AUDIT_LOGS_REPOSITORY');

export interface AdminAuditLogsRepository {
  /**
   * 감사 로그 한 건을 저장한다.
   *
   * @param {RecordAdminAuditLogInput} input - 기록할 작업
   * @param {Prisma.TransactionClient | undefined} tx - 작업과 같은 트랜잭션 client
   * @returns {Promise<void>} 저장 완료
   */
  create(input: RecordAdminAuditLogInput, tx?: Prisma.TransactionClient): Promise<void>;

  /**
   * 조건에 맞는 감사 로그를 최신순으로 한 페이지 조회한다.
   *
   * @param {AdminAuditLogFilter} filter - 필터
   * @param {PaginationParams} pagination - 페이지 정보
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ items: AdminAuditLogListItem[]; totalCount: number }>} 한 페이지와 전체 개수
   */
  findMany(
    filter: AdminAuditLogFilter,
    pagination: PaginationParams,
    tx?: Prisma.TransactionClient,
  ): Promise<{ items: AdminAuditLogListItem[]; totalCount: number }>;
}
