import type { GetNotificationsQuery } from '../dto/get-notifications-query.dto';
import type { MarkNotificationReadResult } from '../types/mark-notification-read-result.type';
import type { GetNotificationsResult } from '../types/notification-list-item.type';
import type { UnreadNotificationCountResult } from '../types/unread-notification-count-result.type';

export const NOTIFICATIONS_REPOSITORY = Symbol('NOTIFICATIONS_REPOSITORY');

export interface NotificationsRepository {
  findNotifications(userId: string, query: GetNotificationsQuery): Promise<GetNotificationsResult>;
  markNotificationAsRead(userId: string, notificationId: string): Promise<MarkNotificationReadResult | undefined>;
  countUnreadNotifications(userId: string): Promise<UnreadNotificationCountResult>;
}
