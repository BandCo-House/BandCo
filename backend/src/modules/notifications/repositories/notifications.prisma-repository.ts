import { Injectable } from '@nestjs/common';

import { createPagination } from '../../../common/pagination';
import { PrismaService } from '../../../database/prisma';
import type { GetNotificationsQuery } from '../dto/get-notifications-query.dto';
import type { MarkNotificationReadResult } from '../types/mark-notification-read-result.type';
import type { GetNotificationsResult, NotificationListItem } from '../types/notification-list-item.type';
import type { UnreadNotificationCountResult } from '../types/unread-notification-count-result.type';

import type { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsPrismaRepository implements NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 사용자별 알림 목록을 필터와 페이지 조건에 맞게 조회한다.
   *
   * @param {string} userId - 현재 로그인 사용자 대신 임시로 사용하는 조회 대상 사용자 ID
   * @param {GetNotificationsQuery} query - 필터와 페이지네이션 조건
   * @returns {Promise<GetNotificationsResult>} 목록 데이터와 페이지네이션 메타데이터
   */
  async findNotifications(userId: string, query: GetNotificationsQuery): Promise<GetNotificationsResult> {
    const where = {
      userId,
      isRead: query.isRead,
      type: query.type,
      createdAt: {
        gte: query.from,
        lte: query.to,
      },
    };
    const paginationOffset = (query.page - 1) * query.size;
    const orderBy = this.createOrderBy(query.sort);

    const [totalCount, notifications] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy,
        skip: paginationOffset,
        take: query.size,
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          isRead: true,
          targetPath: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      items: notifications.map(notification => this.mapNotification(notification)),
      pagination: createPagination(totalCount, {
        page: query.page,
        size: query.size,
      }),
    };
  }

  /**
   * 현재 사용자 소유 알림만 읽음 상태로 바꾼다.
   *
   * @param {string} userId - 현재 로그인 사용자 대신 임시로 사용하는 사용자 ID
   * @param {string} notificationId - 읽음 처리할 알림 ID
   * @returns {Promise<MarkNotificationReadResult | undefined>} 읽음 처리 결과 또는 대상 없음
   */
  async markNotificationAsRead(userId: string, notificationId: string): Promise<MarkNotificationReadResult | undefined> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (notification === null) {
      return undefined;
    }

    const updatedNotification = await this.prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
      select: {
        id: true,
        isRead: true,
      },
    });

    return {
      notificationId: updatedNotification.id,
      isRead: updatedNotification.isRead,
    };
  }

  /**
   * 사용자 기준 안읽음 알림 총 개수와 타입별 개수를 함께 집계한다.
   *
   * @param {string} userId - 현재 로그인 사용자 대신 임시로 사용하는 사용자 ID
   * @returns {Promise<UnreadNotificationCountResult>} 안읽음 총 개수와 타입별 개수
   */
  async countUnreadNotifications(userId: string): Promise<UnreadNotificationCountResult> {
    const [unreadCount, unreadInviteCount, unreadNoticeCount, unreadReminderCount] = await this.prisma.$transaction([
      this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
      this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
          type: 'INVITE',
        },
      }),
      this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
          type: 'NOTICE',
        },
      }),
      this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
          type: 'REMINDER',
        },
      }),
    ]);

    return {
      unreadCount,
      unreadByType: {
        INVITE: unreadInviteCount,
        NOTICE: unreadNoticeCount,
        REMINDER: unreadReminderCount,
      },
    };
  }

  /**
   * 현재 목록 화면은 생성 시각 기준 정렬만 허용하고, 값이 없으면 최신순으로 본다.
   *
   * @param {string | undefined} sort - 요청에서 받은 정렬 문자열
   * @returns {{ createdAt: 'asc' | 'desc' }} Prisma orderBy 객체
   */
  private createOrderBy(sort: string | undefined): { createdAt: 'asc' | 'desc' } {
    if (sort === 'createdAt,asc') {
      return {
        createdAt: 'asc',
      };
    }

    return {
      createdAt: 'desc',
    };
  }

  /**
   * DB 레코드를 알림 목록 응답 형식으로 변환한다.
   *
   * @param notification - Prisma에서 조회한 알림 레코드
   * @returns {NotificationListItem} 프론트 목록 화면에서 바로 쓸 수 있는 알림 데이터
   */
  private mapNotification(notification: {
    id: string;
    type: 'INVITE' | 'NOTICE' | 'REMINDER';
    title: string | null;
    description: string | null;
    isRead: boolean;
    targetPath: string | null;
    createdAt: Date | null;
  }): NotificationListItem {
    return {
      notificationId: notification.id,
      type: notification.type,
      title: notification.title ?? '',
      description: notification.description ?? '',
      isRead: notification.isRead,
      targetPath: notification.targetPath ?? '',
      createdAt: notification.createdAt?.toISOString() ?? '',
    };
  }
}
