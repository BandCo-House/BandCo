import { Injectable } from '@nestjs/common';
import type { PaginationParams } from 'src/common/pagination';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import { toSkipTake } from '../../core/types/admin-paginated.type';
import type { AdminNoticeContent, AdminNotification, AdminNotificationSource, CreateAdminNotificationInput } from '../types/admin-notification.type';

import type { AdminUserNotificationsRepository } from './admin-user-notifications.repository';

@Injectable()
export class AdminUserNotificationsPrismaRepository implements AdminUserNotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findNotificationsByUserId(
    userId: string,
    pagination: PaginationParams,
    tx?: Prisma.TransactionClient,
  ): Promise<{ items: AdminNotification[]; totalCount: number }> {
    const client = tx ?? this.prisma;
    const where: Prisma.NotificationWhereInput = { userId };

    const [rows, totalCount] = await Promise.all([
      client.notification.findMany({
        where,
        orderBy: [{ createdAt: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }],
        ...toSkipTake(pagination),
        select: { id: true, type: true, title: true, description: true, targetPath: true, isRead: true, createdAt: true },
      }),
      client.notification.count({ where }),
    ]);

    const items = rows.map(row => ({
      notificationId: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      targetPath: row.targetPath,
      isRead: row.isRead,
      createdAt: row.createdAt?.toISOString() ?? null,
    }));

    return { items, totalCount };
  }

  async findNotificationSource(notificationId: string, tx?: Prisma.TransactionClient): Promise<AdminNotificationSource | null> {
    const client = tx ?? this.prisma;
    const notification = await client.notification.findUnique({
      where: { id: notificationId },
      select: {
        userId: true,
        type: true,
        title: true,
        description: true,
        targetPath: true,
        referenceType: true,
        referenceId: true,
        user: { select: { deletedAt: true } },
      },
    });
    if (notification === null) {
      return null;
    }

    const { user, ...source } = notification;
    return { ...source, isRecipientDeleted: user.deletedAt !== null };
  }

  async createNotification(input: CreateAdminNotificationInput, tx?: Prisma.TransactionClient): Promise<string> {
    const client = tx ?? this.prisma;
    const created = await client.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        description: input.description,
        targetPath: input.targetPath,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
      },
      select: { id: true },
    });

    return created.id;
  }

  async createNoticeForActiveUsers(content: AdminNoticeContent, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx ?? this.prisma;
    const users = await client.user.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      select: { id: true },
    });

    if (users.length === 0) {
      return 0;
    }

    const result = await client.notification.createMany({
      data: users.map(user => ({
        userId: user.id,
        type: 'NOTICE' as const,
        title: content.title,
        description: content.description ?? null,
        targetPath: content.targetPath ?? null,
      })),
    });

    return result.count;
  }
}
