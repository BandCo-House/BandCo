import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PaginationParams } from 'src/common/pagination';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import { type AdminPaginatedResult, toAdminPaginatedResult } from '../core/types/admin-paginated.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { ADMIN_REPORTS_REPOSITORY, type AdminReportsRepository } from './repositories/admin-reports.repository';
import type { AdminReport, AdminReportFilter, ResolveAdminReportInput } from './types/admin-report.type';

const REPORT_NOT_FOUND_MESSAGE = '신고를 찾을 수 없습니다.';
const REPORT_ALREADY_RESOLVED_MESSAGE = '이미 처리된 신고입니다.';

@Injectable()
export class AdminReportsService {
  constructor(
    @Inject(ADMIN_REPORTS_REPOSITORY)
    private readonly reportsRepository: AdminReportsRepository,
    private readonly auditLogsService: AdminAuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 신고를 최신순으로 조회한다.
   *
   * @param {AdminReportFilter} filter - 상태 필터
   * @param {PaginationParams} pagination - 페이지 정보
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminPaginatedResult<AdminReport>>} 신고 목록
   */
  async getReports(
    filter: AdminReportFilter,
    pagination: PaginationParams,
    tx?: Prisma.TransactionClient,
  ): Promise<AdminPaginatedResult<AdminReport>> {
    const { items, totalCount } = await this.reportsRepository.findMany(filter, pagination, new Date(), tx);
    return toAdminPaginatedResult(items, totalCount, pagination);
  }

  /**
   * 신고 한 건을 조회한다.
   *
   * @param {string} reportId - 신고 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminReport>} 신고
   */
  async getReport(reportId: string, tx?: Prisma.TransactionClient): Promise<AdminReport> {
    const report = await this.reportsRepository.findById(reportId, new Date(), tx);
    if (report === null) {
      throw new NotFoundException(REPORT_NOT_FOUND_MESSAGE);
    }

    return report;
  }

  /**
   * PENDING 신고를 처리 완료 또는 기각으로 바꾸고 감사 로그를 남긴다.
   * 처리 결과는 되돌리지 않으므로 이미 처리된 신고는 다시 처리할 수 없다.
   *
   * @param {AdminPrincipal} actor - 요청한 어드민
   * @param {string} reportId - 신고 ID
   * @param {ResolveAdminReportInput} input - 처리 결과와 메모
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminReport>} 처리된 신고
   */
  async resolveReport(actor: AdminPrincipal, reportId: string, input: ResolveAdminReportInput, tx?: Prisma.TransactionClient): Promise<AdminReport> {
    const run = async (client: Prisma.TransactionClient): Promise<AdminReport> => {
      const now = new Date();
      const report = await this.reportsRepository.findById(reportId, now, client);
      if (report === null) {
        throw new NotFoundException(REPORT_NOT_FOUND_MESSAGE);
      }
      if (report.status !== 'PENDING') {
        throw new BadRequestException(REPORT_ALREADY_RESOLVED_MESSAGE);
      }

      // 조회와 갱신 사이에 다른 어드민이 먼저 처리했으면 갱신되지 않는다.
      const isResolved = await this.reportsRepository.resolvePending(
        reportId,
        { status: input.status, resolutionNote: input.resolutionNote ?? null, resolvedAt: now, resolvedByAdminId: actor.id },
        client,
      );
      if (!isResolved) {
        throw new BadRequestException(REPORT_ALREADY_RESOLVED_MESSAGE);
      }

      await this.auditLogsService.record(
        { adminUserId: actor.id, action: 'REPORT_RESOLVE', targetType: 'REPORT', targetId: reportId, detail: { status: input.status } },
        client,
      );

      const resolvedReport = await this.reportsRepository.findById(reportId, now, client);
      if (resolvedReport === null) {
        throw new NotFoundException(REPORT_NOT_FOUND_MESSAGE);
      }

      return resolvedReport;
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }
}
