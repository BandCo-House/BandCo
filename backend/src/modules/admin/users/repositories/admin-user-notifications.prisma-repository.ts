import { Injectable } from '@nestjs/common';
import type { PaginationParams } from 'src/common/pagination';
import { buildActiveSuspensionWhere } from 'src/common/sanction/active-suspension.where';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import { toSkipTake } from '../../core/types/admin-paginated.type';
import type { AdminNoticeContent, AdminNotification, AdminNotificationSource, CreateAdminNotificationInput } from '../types/admin-notification.type';

import type { AdminUserNotificationsRepository } from './admin-user-notifications.repository';

/** 전체 발송 시 createMany 한 번에 넣는 알림 수 */
const NOTICE_BROADCAST_CHUNK_SIZE = 1000;

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

  async createNoticeForActiveUsers(content: AdminNoticeContent, now: Date, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx ?? this.prisma;
    // 정지 회원은 로그인할 수 없어 알림을 봐도 의미가 없으므로 뺀다
    const users = await client.user.findMany({
      where: { deletedAt: null, status: 'ACTIVE', sanctions: { none: buildActiveSuspensionWhere(now) } },
      select: { id: true },
    });

    // 한 번에 넣으면 쿼리 파라미터 수가 회원 수에 비례해 커지므로 나눠 넣는다
    let createdCount = 0;
    for (let start = 0; start < users.length; start += NOTICE_BROADCAST_CHUNK_SIZE) {
      const chunk = users.slice(start, start + NOTICE_BROADCAST_CHUNK_SIZE);
      const result = await client.notification.createMany({
        data: chunk.map(user => ({
          userId: user.id,
          type: 'NOTICE' as const,
          title: content.title,
          description: content.description ?? null,
          targetPath: content.targetPath ?? null,
        })),
      });
      createdCount += result.count;
    }

    return createdCount;
  }
}
