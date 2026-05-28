import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma';

import type { GetNotificationsQuery } from './dto/get-notifications-query.dto';
import {
  type CreateNotificationRepositoryInput,
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepository,
} from './repositories/notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async createNotification(input: CreateNotificationRepositoryInput, tx?: Prisma.TransactionClient) {
    return this.notificationsRepository.createNotification(input, tx);
  }

  async createManyNotifications(inputs: CreateNotificationRepositoryInput[], tx?: Prisma.TransactionClient) {
    return this.notificationsRepository.createManyNotifications(inputs, tx);
  }

  async getNotifications(userId: string, query: GetNotificationsQuery, tx?: Prisma.TransactionClient) {
    return this.notificationsRepository.findNotifications(userId, query, tx);
  }

  async markManyNotificationsAsRead(userId: string, notificationIds: string[], tx?: Prisma.TransactionClient) {
    return this.notificationsRepository.markManyNotificationsAsRead(userId, notificationIds, tx);
  }

  async markAllNotificationsAsRead(userId: string, tx?: Prisma.TransactionClient) {
    return this.notificationsRepository.markAllNotificationsAsRead(userId, tx);
  }

  async deleteNotification(userId: string, notificationId: string, tx?: Prisma.TransactionClient) {
    const result = await this.notificationsRepository.deleteNotification(userId, notificationId, tx);
    if (result === undefined) {
      throw new NotFoundException('요청한 알림을 찾을 수 없습니다.');
    }
    return result;
  }

  async markNotificationAsRead(userId: string, notificationId: string, tx?: Prisma.TransactionClient) {
    const result = await this.notificationsRepository.markNotificationAsRead(userId, notificationId, tx);
    if (result === undefined) {
      throw new NotFoundException('요청한 알림을 찾을 수 없습니다.');
    }
    return result;
  }

  async deleteManyNotifications(userId: string, notificationIds: string[], tx?: Prisma.TransactionClient) {
    return this.notificationsRepository.deleteManyNotifications(userId, notificationIds, tx);
  }
}
