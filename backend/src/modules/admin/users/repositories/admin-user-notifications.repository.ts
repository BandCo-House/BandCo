import type { PaginationParams } from 'src/common/pagination';
import type { Prisma } from 'src/generated/prisma';

import type { AdminNoticeContent, AdminNotification, AdminNotificationSource, CreateAdminNotificationInput } from '../types/admin-notification.type';

export const ADMIN_USER_NOTIFICATIONS_REPOSITORY = Symbol('ADMIN_USER_NOTIFICATIONS_REPOSITORY');

export interface AdminUserNotificationsRepository {
  /**
   * 회원 한 명의 알림을 최신순으로 한 페이지 조회한다.
   *
   * @param {string} userId - 회원 ID
   * @param {PaginationParams} pagination - 페이지 정보
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ items: AdminNotification[]; totalCount: number }>} 한 페이지와 전체 개수
   */
  findNotificationsByUserId(
    userId: string,
    pagination: PaginationParams,
    tx?: Prisma.TransactionClient,
  ): Promise<{ items: AdminNotification[]; totalCount: number }>;

  /**
   * 재발송할 원본 알림을 조회한다.
   *
   * @param {string} notificationId - 알림 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<CreateAdminNotificationInput | null>} 복사에 필요한 원본 값, 없으면 null
   */
  findNotificationSource(notificationId: string, tx?: Prisma.TransactionClient): Promise<AdminNotificationSource | null>;

  /**
   * 읽지 않은 알림 한 건을 만든다.
   *
   * @param {CreateAdminNotificationInput} input - 알림 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<string>} 생성된 알림 ID
   */
  createNotification(input: CreateAdminNotificationInput, tx?: Prisma.TransactionClient): Promise<string>;

  /**
   * 탈퇴하지 않은 ACTIVE 회원 중 이용 정지 중이 아닌 회원 전체에게 NOTICE 알림을 만든다.
   *
   * @param {AdminNoticeContent} content - 알림 본문
   * @param {Date} now - 활성 정지 판정 기준 시각
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<number>} 생성된 알림 수
   */
  createNoticeForActiveUsers(content: AdminNoticeContent, now: Date, tx?: Prisma.TransactionClient): Promise<number>;
}
