import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

import { parseToPrismaQuery } from '../../../common/query';
import { buildNextPath } from '../../../common/url';
import type { NotificationReferenceType, NotificationType, Prisma } from '../../../generated/prisma';
import type { GetNotificationsQuery } from '../dto/get-notifications-query.dto';
import type { DeleteManyNotificationsResult } from '../types/delete-many-notifications-result.type';
import type { DeleteNotificationResult } from '../types/delete-notification-result.type';
import type { MarkAllReadResult } from '../types/mark-all-read-result.type';
import type { MarkManyReadResult } from '../types/mark-many-read-result.type';
import type { MarkNotificationReadResult } from '../types/mark-notification-read-result.type';
import type { GetNotificationsResult, NotificationListItem, NotificationReference } from '../types/notification-list-item.type';

import type { CreateNotificationRepositoryInput, NotificationsRepository } from './notifications.repository';

type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string | null;
  description: string | null;
  isRead: boolean;
  targetPath: string | null;
  referenceType: NotificationReferenceType | null;
  referenceId: string | null;
  createdAt: Date | null;
};

@Injectable()
export class NotificationsPrismaRepository implements NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(input: CreateNotificationRepositoryInput, tx?: Prisma.TransactionClient): Promise<void> {
    const client = this.getClient(tx);

    await client.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        description: input.description,
        targetPath: input.targetPath,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        remindsAt: input.remindsAt,
      },
    });
  }

  async createManyNotifications(inputs: CreateNotificationRepositoryInput[], tx?: Prisma.TransactionClient): Promise<void> {
    if (inputs.length === 0) {
      return;
    }

    const client = this.getClient(tx);

    await client.notification.createMany({
      data: inputs.map(input => ({
        userId: input.userId,
        type: input.type,
        title: input.title,
        description: input.description,
        targetPath: input.targetPath,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        remindsAt: input.remindsAt,
      })),
    });
  }

  async findNotifications(userId: string, query: GetNotificationsQuery, tx?: Prisma.TransactionClient): Promise<GetNotificationsResult> {
    const client = this.getClient(tx);
    const { where, orderBy } = parseToPrismaQuery<Prisma.NotificationWhereInput>(query);
    where.userId = userId;

    const cursorId = query.cursor__id;

    const rows = await client.notification.findMany({
      where,
      orderBy,
      take: query.take + 1,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        isRead: true,
        targetPath: true,
        referenceType: true,
        referenceId: true,
        createdAt: true,
      },
    });
    const hasNext = rows.length > query.take;
    const notifications = hasNext ? rows.slice(0, query.take) : rows;
    const count = notifications.length;
    const lastItem = notifications[count - 1];
    const next =
      hasNext && lastItem
        ? buildNextPath('/notifications/me', {
            where__is_read: query.where__is_read,
            where__type: query.where__type,
            order__created_at: query.order__created_at,
            order__id: query.order__id,
            take: query.take,
            cursor__id: lastItem.id,
          })
        : null;

    const references = await this.resolveInvitationReferences(notifications, client);

    return {
      items: notifications.map(n => this.mapNotification(n, references)),
      meta: { count, take: query.take, next },
    };
  }

  /**
   * BAND_INVITATION 참조를 가진 알림에 대해 초대의 발신자와 현재 상태를 한 번에 조회한다.
   * 초대 응답은 상태 변경으로 처리되므로 PENDING·ACCEPTED·DECLINED 모두 상태를 반환한다.
   * 초대가 삭제된 경우에만 reference가 null이 된다.
   */
  private async resolveInvitationReferences(
    notifications: NotificationRow[],
    client: Prisma.TransactionClient,
  ): Promise<Map<string, NotificationReference>> {
    const invitationIds = notifications
      .filter(n => n.referenceType === 'BAND_INVITATION' && n.referenceId !== null)
      .map(n => n.referenceId as string);

    if (invitationIds.length === 0) {
      return new Map();
    }

    const invitations = await client.bandInvitation.findMany({
      where: { id: { in: invitationIds } },
      select: {
        id: true,
        status: true,
        inviterBandMember: {
          select: {
            user: {
              select: {
                id: true,
                profile: { select: { nickname: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });

    return new Map(
      invitations.map(invitation => [
        invitation.id,
        {
          type: 'BAND_INVITATION' as NotificationReferenceType,
          id: invitation.id,
          status: invitation.status,
          sender: {
            userId: invitation.inviterBandMember.user.id,
            nickname: invitation.inviterBandMember.user.profile?.nickname ?? '',
            avatarUrl: invitation.inviterBandMember.user.profile?.avatarUrl ?? null,
          },
        },
      ]),
    );
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

  private mapNotification(notification: NotificationRow, references: Map<string, NotificationReference>): NotificationListItem {
    const reference = notification.referenceId !== null ? (references.get(notification.referenceId) ?? null) : null;

    return {
      notificationId: notification.id,
      type: notification.type,
      title: notification.title ?? '',
      description: notification.description ?? '',
      isRead: notification.isRead,
      targetPath: notification.targetPath ?? '',
      reference,
      createdAt: notification.createdAt?.toISOString() ?? '',
    };
  }
}
