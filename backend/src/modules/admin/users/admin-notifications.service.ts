import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PaginationParams } from 'src/common/pagination';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import { type AdminPaginatedResult, toAdminPaginatedResult } from '../core/types/admin-paginated.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { ADMIN_MANAGED_USERS_REPOSITORY, type AdminManagedUsersRepository } from './repositories/admin-managed-users.repository';
import { ADMIN_USER_NOTIFICATIONS_REPOSITORY, type AdminUserNotificationsRepository } from './repositories/admin-user-notifications.repository';
import type {
  AdminNoticeContent,
  AdminNotification,
  AdminNotificationIdResult,
  BroadcastAdminNotificationResult,
} from './types/admin-notification.type';

@Injectable()
export class AdminNotificationsService {
  constructor(
    @Inject(ADMIN_USER_NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: AdminUserNotificationsRepository,
    @Inject(ADMIN_MANAGED_USERS_REPOSITORY)
    private readonly managedUsersRepository: AdminManagedUsersRepository,
    private readonly auditLogsService: AdminAuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 회원 한 명의 알림을 최신순으로 조회한다. 탈퇴 회원의 알림도 확인할 수 있다.
   *
   * @param {string} userId - 회원 ID
   * @param {PaginationParams} pagination - 페이지 정보
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminPaginatedResult<AdminNotification>>} 알림 목록
   */
  async getUserNotifications(
    userId: string,
    pagination: PaginationParams,
    tx?: Prisma.TransactionClient,
  ): Promise<AdminPaginatedResult<AdminNotification>> {
    const user = await this.managedUsersRepository.findUserState(userId, tx);
    if (user === null) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    const { items, totalCount } = await this.notificationsRepository.findNotificationsByUserId(userId, pagination, tx);
    return toAdminPaginatedResult(items, totalCount, pagination);
  }

  /**
   * 회원 한 명에게 관리자 공지(NOTICE) 알림을 보낸다. 탈퇴 회원은 받을 수 없어 404로 막는다.
   *
   * @param {AdminPrincipal} actor - 요청한 어드민
   * @param {string} userId - 회원 ID
   * @param {AdminNoticeContent} content - 알림 본문
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminNotificationIdResult>} 생성된 알림 ID
   */
  async sendNotice(
    actor: AdminPrincipal,
    userId: string,
    content: AdminNoticeContent,
    tx?: Prisma.TransactionClient,
  ): Promise<AdminNotificationIdResult> {
    const run = async (client: Prisma.TransactionClient): Promise<AdminNotificationIdResult> => {
      const user = await this.managedUsersRepository.findUserState(userId, client);
      if (user === null || user.deletedAt !== null) {
        throw new NotFoundException('회원을 찾을 수 없습니다.');
      }

      const notificationId = await this.notificationsRepository.createNotification(
        {
          userId,
          type: 'NOTICE',
          title: content.title,
          description: content.description ?? null,
          targetPath: content.targetPath ?? null,
          referenceType: null,
          referenceId: null,
        },
        client,
      );
      await this.auditLogsService.record(
        {
          adminUserId: actor.id,
          action: 'NOTIFICATION_SEND',
          targetType: 'USER',
          targetId: userId,
          detail: { notificationId, title: content.title },
        },
        client,
      );

      return { notificationId };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 기존 알림을 같은 내용의 읽지 않은 새 알림으로 다시 보낸다. 원본은 그대로 둔다.
   *
   * @param {AdminPrincipal} actor - 요청한 어드민
   * @param {string} notificationId - 원본 알림 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminNotificationIdResult>} 새 알림 ID
   */
  async resendNotification(actor: AdminPrincipal, notificationId: string, tx?: Prisma.TransactionClient): Promise<AdminNotificationIdResult> {
    const run = async (client: Prisma.TransactionClient): Promise<AdminNotificationIdResult> => {
      const source = await this.notificationsRepository.findNotificationSource(notificationId, client);
      if (source === null) {
        throw new NotFoundException('알림을 찾을 수 없습니다.');
      }
      // 초대 알림을 복제하면 이미 처리됐거나 만료된 초대를 가리키는 수락 버튼이 하나 더 생긴다
      if (source.type !== 'NOTICE') {
        throw new BadRequestException('공지 알림만 재발송할 수 있습니다.');
      }
      if (source.isRecipientDeleted) {
        throw new BadRequestException('탈퇴한 회원에게는 알림을 재발송할 수 없습니다.');
      }

      const { isRecipientDeleted: _isRecipientDeleted, ...notificationContent } = source;
      const newNotificationId = await this.notificationsRepository.createNotification(notificationContent, client);
      await this.auditLogsService.record(
        { adminUserId: actor.id, action: 'NOTIFICATION_RESEND', targetType: 'NOTIFICATION', targetId: notificationId, detail: { newNotificationId } },
        client,
      );

      return { notificationId: newNotificationId };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 탈퇴하지 않은 ACTIVE 회원 전체에게 관리자 공지 알림을 보낸다.
   *
   * @param {AdminPrincipal} actor - 요청한 SUPER_ADMIN
   * @param {AdminNoticeContent} content - 알림 본문
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<BroadcastAdminNotificationResult>} 발송 건수
   */
  async broadcastNotice(
    actor: AdminPrincipal,
    content: AdminNoticeContent,
    tx?: Prisma.TransactionClient,
  ): Promise<BroadcastAdminNotificationResult> {
    const run = async (client: Prisma.TransactionClient): Promise<BroadcastAdminNotificationResult> => {
      const sentCount = await this.notificationsRepository.createNoticeForActiveUsers(content, client);
      await this.auditLogsService.record(
        {
          adminUserId: actor.id,
          action: 'NOTIFICATION_BROADCAST',
          targetType: 'NOTIFICATION',
          targetId: null,
          detail: { title: content.title, sentCount },
        },
        client,
      );

      return { sentCount };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }
}
