import type { GetNotificationsQuery } from '../dto/get-notifications-query.dto';
import type { MarkAllReadResult } from '../types/mark-all-read-result.type';
import type { MarkNotificationReadResult } from '../types/mark-notification-read-result.type';
import type { GetNotificationsResult } from '../types/notification-list-item.type';

export const NOTIFICATIONS_REPOSITORY = Symbol('NOTIFICATIONS_REPOSITORY');

export interface NotificationsRepository {
  findNotifications(userId: string, query: GetNotificationsQuery): Promise<GetNotificationsResult>;
  markNotificationAsRead(userId: string, notificationId: string): Promise<MarkNotificationReadResult | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<MarkAllReadResult>;
}
