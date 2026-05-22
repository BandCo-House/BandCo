import type { Prisma } from '../../../generated/prisma';
import type { GetNotificationsQuery } from '../dto/get-notifications-query.dto';
import type { DeleteManyNotificationsResult } from '../types/delete-many-notifications-result.type';
import type { DeleteNotificationResult } from '../types/delete-notification-result.type';
import type { MarkAllReadResult } from '../types/mark-all-read-result.type';
import type { MarkManyReadResult } from '../types/mark-many-read-result.type';
import type { MarkNotificationReadResult } from '../types/mark-notification-read-result.type';
import type { GetNotificationsResult } from '../types/notification-list-item.type';

export const NOTIFICATIONS_REPOSITORY = Symbol('NOTIFICATIONS_REPOSITORY');

export interface NotificationsRepository {
  findNotifications(userId: string, query: GetNotificationsQuery, tx?: Prisma.TransactionClient): Promise<GetNotificationsResult>;
  markAllNotificationsAsRead(userId: string, tx?: Prisma.TransactionClient): Promise<MarkAllReadResult>;
  markManyNotificationsAsRead(userId: string, notificationIds: string[], tx?: Prisma.TransactionClient): Promise<MarkManyReadResult>;
  markNotificationAsRead(userId: string, notificationId: string, tx?: Prisma.TransactionClient): Promise<MarkNotificationReadResult | undefined>;
  deleteNotification(userId: string, notificationId: string, tx?: Prisma.TransactionClient): Promise<DeleteNotificationResult | undefined>;
  deleteManyNotifications(userId: string, notificationIds: string[], tx?: Prisma.TransactionClient): Promise<DeleteManyNotificationsResult>;
}
