import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

import type { NotificationType } from '../../../generated/prisma';
import type { GetNotificationsQuery } from '../dto/get-notifications-query.dto';
import type { DeleteNotificationResult } from '../types/delete-notification-result.type';
import type { MarkAllReadResult } from '../types/mark-all-read-result.type';
import type { MarkManyReadResult } from '../types/mark-many-read-result.type';
import type { MarkNotificationReadResult } from '../types/mark-notification-read-result.type';
import type { GetNotificationsResult, NotificationListItem } from '../types/notification-list-item.type';

import type { NotificationsRepository } from './notifications.repository';

type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string | null;
  description: string | null;
  isRead: boolean;
  targetPath: string | null;
  createdAt: Date | null;
};

@Injectable()
export class NotificationsPrismaRepository implements NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findNotifications(userId: string, query: GetNotificationsQuery): Promise<GetNotificationsResult> {
    const where = {
      userId,
      isRead: query.where__is_read,
      type: query.where__type,
    };

    const cursorId = query.cursor__id;

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: query.order__created_at }, { id: query.order__id }],
      take: query.take,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        isRead: true,
        targetPath: true,
        createdAt: true,
      },
    });

    const count = notifications.length;
    const lastItem = notifications[count - 1];
    const next = count === query.take && lastItem ? this.buildNextUrl(query, lastItem) : null;

    return {
      items: notifications.map(n => this.mapNotification(n)),
      meta: { count, take: query.take, next },
    };
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<MarkNotificationReadResult | undefined> {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
      select: { id: true },
    });

    if (notification === null) {
      return undefined;
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        isRead: true,
        targetPath: true,
        createdAt: true,
      },
    });

    return {
      notificationId: updated.id,
      type: updated.type,
      title: updated.title ?? '',
      description: updated.description ?? '',
      isRead: updated.isRead,
      targetPath: updated.targetPath ?? '',
      createdAt: updated.createdAt?.toISOString() ?? '',
    };
  }

  async markManyNotificationsAsRead(userId: string, notificationIds: string[]): Promise<MarkManyReadResult> {
    return this.prisma.$transaction(async tx => {
      const targets = await tx.notification.findMany({
        where: { userId, id: { in: notificationIds }, isRead: false },
        select: { id: true },
      });
      const targetIds = targets.map(n => n.id);
      await tx.notification.updateMany({
        where: { id: { in: targetIds } },
        data: { isRead: true },
      });
      return { updatedCount: targetIds.length, notificationIds: targetIds };
    });
  }

  async markAllNotificationsAsRead(userId: string): Promise<MarkAllReadResult> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updatedCount: result.count };
  }

  async deleteNotification(userId: string, notificationId: string): Promise<DeleteNotificationResult | undefined> {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
      select: { id: true },
    });

    if (notification === null) {
      return undefined;
    }

    await this.prisma.notification.delete({ where: { id: notificationId } });
    return { notificationId };
  }

  private buildNextUrl(query: GetNotificationsQuery, lastItem: NotificationRow): string {
    const params = new URLSearchParams();
    if (query.where__is_read !== undefined) params.set('where__is_read', String(query.where__is_read));
    if (query.where__type !== undefined) params.set('where__type', query.where__type);
    params.set('order__created_at', query.order__created_at);
    params.set('order__id', query.order__id);
    params.set('take', String(query.take));
    params.set('cursor__created_at', lastItem.createdAt?.toISOString() ?? '');
    params.set('cursor__id', lastItem.id);
    return `/notifications/me?${params.toString()}`;
  }

  private mapNotification(notification: NotificationRow): NotificationListItem {
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
