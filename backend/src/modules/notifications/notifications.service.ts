import { Inject, Injectable } from '@nestjs/common';

import type { GetNotificationsQuery } from './dto/get-notifications-query.dto';
import { NOTIFICATIONS_REPOSITORY, type NotificationsRepository } from './repositories/notifications.repository';
import type { GetNotificationsResult } from './types/notification-list-item.type';

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
    return this.notificationsRepository.findNotifications(DEMO_NOTIFICATION_USER_ID, query);
  }
}
