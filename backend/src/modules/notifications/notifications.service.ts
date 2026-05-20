import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { GetNotificationsQuery } from './dto/get-notifications-query.dto';
import { NOTIFICATIONS_REPOSITORY, type NotificationsRepository } from './repositories/notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async getNotifications(userId: string, query: GetNotificationsQuery) {
    return this.notificationsRepository.findNotifications(userId, query);
  }

  async markManyNotificationsAsRead(userId: string, notificationIds: string[]) {
    return this.notificationsRepository.markManyNotificationsAsRead(userId, notificationIds);
  }

  async markAllNotificationsAsRead(userId: string) {
    return this.notificationsRepository.markAllNotificationsAsRead(userId);
  }

  async deleteNotification(userId: string, notificationId: string) {
    const result = await this.notificationsRepository.deleteNotification(userId, notificationId);
    if (result === undefined) {
      throw new NotFoundException('요청한 알림을 찾을 수 없습니다.');
    }
    return result;
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    const result = await this.notificationsRepository.markNotificationAsRead(userId, notificationId);
    if (result === undefined) {
      throw new NotFoundException('요청한 알림을 찾을 수 없습니다.');
    }
    return result;
  }
}
