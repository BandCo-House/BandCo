import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

import type { NotificationType, Prisma } from '../../../generated/prisma';
import type { GetNotificationsQuery } from '../dto/get-notifications-query.dto';
import type { DeleteManyNotificationsResult } from '../types/delete-many-notifications-result.type';
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

  async findNotifications(userId: string, query: GetNotificationsQuery, tx?: Prisma.TransactionClient): Promise<GetNotificationsResult> {
    const client = this.getClient(tx);
    const where = {
      userId,
      isRead: query.where__is_read,
      type: query.where__type,
    };

    const cursorId = query.cursor__id;

    const rows = await client.notification.findMany({
      where,
      orderBy: [{ createdAt: query.order__created_at }, { id: query.order__id }],
      take: query.take + 1,
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
    const hasNext = rows.length > query.take;
    const notifications = hasNext ? rows.slice(0, query.take) : rows;
    const count = notifications.length;
    const lastItem = notifications[count - 1];
    const next = hasNext && lastItem ? this.buildNextUrl(query, lastItem) : null;

    return {
      items: notifications.map(n => this.mapNotification(n)),
      meta: { count, take: query.take, next },
    };
  }

  async markNotificationAsRead(
    userId: string,
    notificationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<MarkNotificationReadResult | undefined> {
    const client = this.getClient(tx);

    const notification = await client.notification.findFirst({
      where: { id: notificationId, userId },
      select: { id: true },
    });

    if (notification === null) {
      return undefined;
    }

    const updated = await client.notification.update({
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

  async markManyNotificationsAsRead(userId: string, notificationIds: string[], tx?: Prisma.TransactionClient): Promise<MarkManyReadResult> {
    const run = async (client: Prisma.TransactionClient) => {
      const targets = await client.notification.findMany({
        where: { userId, id: { in: notificationIds }, isRead: false },
        select: { id: true },
      });
      const targetIds = targets.map(n => n.id);
      await client.notification.updateMany({
        where: { id: { in: targetIds } },
        data: { isRead: true },
      });
      return { updatedCount: targetIds.length, notificationIds: targetIds };
    };
    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  async markAllNotificationsAsRead(userId: string, tx?: Prisma.TransactionClient): Promise<MarkAllReadResult> {
    const result = await this.getClient(tx).notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updatedCount: result.count };
  }

  async deleteNotification(userId: string, notificationId: string, tx?: Prisma.TransactionClient): Promise<DeleteNotificationResult | undefined> {
    const client = this.getClient(tx);

    const notification = await client.notification.findFirst({
      where: { id: notificationId, userId },
      select: { id: true },
    });

    if (notification === null) {
      return undefined;
    }

    await client.notification.delete({ where: { id: notificationId } });
    return { notificationId };
  }

  async deleteManyNotifications(userId: string, notificationIds: string[], tx?: Prisma.TransactionClient): Promise<DeleteManyNotificationsResult> {
    const run = async (client: Prisma.TransactionClient) => {
      const targets = await client.notification.findMany({
        where: { userId, id: { in: notificationIds } },
        select: { id: true },
      });
      const targetIds = targets.map(n => n.id);
      await client.notification.deleteMany({ where: { id: { in: targetIds } } });
      return { deletedCount: targetIds.length, notificationIds: targetIds };
    };
    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  private getClient(tx?: Prisma.TransactionClient): Prisma.TransactionClient {
    return tx ?? (this.prisma as unknown as Prisma.TransactionClient);
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
