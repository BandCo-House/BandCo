import { Inject, Injectable } from '@nestjs/common';
import type { PaginationParams } from 'src/common/pagination';
import type { Prisma } from 'src/generated/prisma';

import { ADMIN_AUDIT_LOGS_REPOSITORY, type AdminAuditLogsRepository } from './repositories/admin-audit-logs.repository';
import type { AdminAuditLogFilter, AdminAuditLogListItem, RecordAdminAuditLogInput } from './types/admin-audit.type';
import { type AdminPaginatedResult, toAdminPaginatedResult } from './types/admin-paginated.type';

@Injectable()
export class AdminAuditLogsService {
  constructor(
    @Inject(ADMIN_AUDIT_LOGS_REPOSITORY)
    private readonly auditLogsRepository: AdminAuditLogsRepository,
  ) {}

  /**
   * 어드민 쓰기 작업을 감사 로그로 남긴다.
   * 작업이 롤백되면 기록도 함께 사라져야 하므로 작업과 같은 tx를 넘겨 호출한다.
   *
   * @param {RecordAdminAuditLogInput} input - 기록할 작업
   * @param {Prisma.TransactionClient | undefined} tx - 작업과 같은 트랜잭션 client
   * @returns {Promise<void>} 기록 완료
   */
  async record(input: RecordAdminAuditLogInput, tx?: Prisma.TransactionClient): Promise<void> {
    await this.auditLogsRepository.create(input, tx);
  }

  /**
   * 감사 로그를 최신순으로 조회한다.
   *
   * @param {AdminAuditLogFilter} filter - 필터
   * @param {PaginationParams} pagination - 페이지 정보
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminPaginatedResult<AdminAuditLogListItem>>} 감사 로그 목록
   */
  async getAuditLogs(
    filter: AdminAuditLogFilter,
    pagination: PaginationParams,
    tx?: Prisma.TransactionClient,
  ): Promise<AdminPaginatedResult<AdminAuditLogListItem>> {
    const { items, totalCount } = await this.auditLogsRepository.findMany(filter, pagination, tx);
    return toAdminPaginatedResult(items, totalCount, pagination);
  }
}
