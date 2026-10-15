import type { Prisma } from 'src/generated/prisma';

import type { CreateUserReportData, CreateUserReportResult } from '../types/user-report.type';

export const USER_REPORTS_REPOSITORY = Symbol('USER_REPORTS_REPOSITORY');

export interface UserReportsRepository {
  /**
   * 탈퇴하지 않은 유저인지 확인한다.
   *
   * @param {string} userId - 유저 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<boolean>} 탈퇴하지 않은 유저가 있으면 true
   */
  existsActiveUser(userId: string, tx?: Prisma.TransactionClient): Promise<boolean>;

  /**
   * 같은 신고자가 같은 대상에게 남긴 처리 대기(PENDING) 신고가 있는지 확인한다.
   *
   * @param {string} reporterUserId - 신고한 유저 ID
   * @param {string} reportedUserId - 신고 대상 유저 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<boolean>} 처리 대기 신고가 있으면 true
   */
  existsPendingReport(reporterUserId: string, reportedUserId: string, tx?: Prisma.TransactionClient): Promise<boolean>;

  /**
   * 신고를 저장한다.
   *
   * @param {CreateUserReportData} data - 저장할 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<CreateUserReportResult>} 생성된 신고 ID
   */
  create(data: CreateUserReportData, tx?: Prisma.TransactionClient): Promise<CreateUserReportResult>;
}
