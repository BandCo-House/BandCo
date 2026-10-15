import type { Prisma } from 'src/generated/prisma';

import type {
  AdminDashboardFunnelCounts,
  AdminDashboardSummaryCounts,
  AdminDashboardSummaryCriteria,
  AdminDashboardUserIdentity,
} from '../types/admin-dashboard.type';

export const ADMIN_DASHBOARD_REPOSITORY = Symbol('ADMIN_DASHBOARD_REPOSITORY');

export interface AdminDashboardRepository {
  /**
   * 대시보드 요약 숫자를 센다.
   *
   * @param {AdminDashboardSummaryCriteria} criteria - 집계 시각 경계
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminDashboardSummaryCounts>} 요약 숫자
   */
  countSummary(criteria: AdminDashboardSummaryCriteria, tx?: Prisma.TransactionClient): Promise<AdminDashboardSummaryCounts>;

  /**
   * 기준 시각 이후 가입한 유저의 가입 시각을 모두 조회한다. 탈퇴한 유저도 포함한다.
   *
   * @param {Date} since - 조회 시작 시각(이상)
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<Date[]>} 가입 시각 목록
   */
  findUserCreatedAtsSince(since: Date, tx?: Prisma.TransactionClient): Promise<Date[]>;

  /**
   * 기간 내 가입한 유저 코호트의 퍼널 단계별 인원을 센다.
   *
   * @param {Date} start - 코호트 가입 시각 시작(이상)
   * @param {Date} end - 코호트 가입 시각 끝(미만)
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminDashboardFunnelCounts>} 단계별 인원
   */
  countFunnel(start: Date, end: Date, tx?: Prisma.TransactionClient): Promise<AdminDashboardFunnelCounts>;

  /**
   * 유저 ID 목록의 닉네임·이메일을 조회한다. DB에 없는 ID는 결과에서 빠진다.
   *
   * @param {string[]} userIds - 조회할 유저 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminDashboardUserIdentity[]>} 유저 식별 정보
   */
  findUserIdentities(userIds: string[], tx?: Prisma.TransactionClient): Promise<AdminDashboardUserIdentity[]>;
}
