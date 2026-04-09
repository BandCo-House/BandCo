import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { GetNotificationsQuery } from './dto/get-notifications-query.dto';
import { NOTIFICATIONS_REPOSITORY, type NotificationsRepository } from './repositories/notifications.repository';
import type { MarkNotificationReadResult } from './types/mark-notification-read-result.type';
import type { GetNotificationsResult } from './types/notification-list-item.type';
import type { UnreadNotificationCountResult } from './types/unread-notification-count-result.type';

const DEMO_NOTIFICATION_USER_ID = '11111111-1111-1111-1111-111111111111';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  /**
   * 인증이 아직 없어서 임시 사용자 기준으로 알림 목록을 조회한다.
   *
   * @param {GetNotificationsQuery} query - 알림 목록 조회 조건
   * @returns {Promise<GetNotificationsResult>} 알림 목록과 페이지 정보
   */
  async getNotifications(query: GetNotificationsQuery): Promise<GetNotificationsResult> {
    if (query.from !== undefined && query.to !== undefined && query.from.getTime() > query.to.getTime()) {
      throw new BadRequestException('from은 to보다 늦을 수 없습니다.');
    }

    return this.notificationsRepository.findNotifications(DEMO_NOTIFICATION_USER_ID, query);
  }

  /**
   * 현재 사용자 기준 안읽음 알림 총 개수와 타입별 개수를 조회한다.
   *
   * @returns {Promise<UnreadNotificationCountResult>} 안읽음 알림 집계 결과
   */
  async getUnreadNotificationCount(): Promise<UnreadNotificationCountResult> {
    return this.notificationsRepository.countUnreadNotifications(DEMO_NOTIFICATION_USER_ID);
  }

  /**
   * 현재 사용자 기준으로 알림을 읽음 처리한다.
   *
   * @param {string} notificationId - 읽음 처리할 알림 ID
   * @returns {Promise<MarkNotificationReadResult>} 읽음 처리 결과
   */
  async markNotificationAsRead(notificationId: string): Promise<MarkNotificationReadResult> {
    const result = await this.notificationsRepository.markNotificationAsRead(DEMO_NOTIFICATION_USER_ID, notificationId);

    if (result === undefined) {
      throw new NotFoundException('요청한 알림을 찾을 수 없습니다.');
    }

    return result;
  }
}
