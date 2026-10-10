import type { PaginationParams } from 'src/common/pagination';
import type { Prisma } from 'src/generated/prisma';

import type { AdminReport, AdminReportFilter, ResolveAdminReportData } from '../types/admin-report.type';

export const ADMIN_REPORTS_REPOSITORY = Symbol('ADMIN_REPORTS_REPOSITORY');

export interface AdminReportsRepository {
  /**
   * 조건에 맞는 신고를 최신순으로 한 페이지 조회한다.
   *
   * @param {AdminReportFilter} filter - 필터
   * @param {PaginationParams} pagination - 페이지 정보
   * @param {Date} now - 피신고자 정지 여부 판정 기준 시각
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ items: AdminReport[]; totalCount: number }>} 한 페이지와 전체 개수
   */
  findMany(
    filter: AdminReportFilter,
    pagination: PaginationParams,
    now: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<{ items: AdminReport[]; totalCount: number }>;

  /**
   * 신고 한 건을 조회한다.
   *
   * @param {string} reportId - 신고 ID
   * @param {Date} now - 피신고자 정지 여부 판정 기준 시각
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminReport | null>} 신고. 없으면 null
   */
  findById(reportId: string, now: Date, tx?: Prisma.TransactionClient): Promise<AdminReport | null>;

  /**
   * PENDING 상태인 신고만 처리 결과로 갱신한다.
   * 두 어드민이 동시에 처리해도 한 번만 반영되도록 상태 조건을 함께 건다.
   *
   * @param {string} reportId - 신고 ID
   * @param {ResolveAdminReportData} data - 저장할 처리 결과
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<boolean>} 갱신했으면 true, 이미 처리된 신고라 갱신하지 않았으면 false
   */
  resolvePending(reportId: string, data: ResolveAdminReportData, tx?: Prisma.TransactionClient): Promise<boolean>;
}
