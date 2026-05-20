import type { GetNotificationsQuery } from '../dto/get-notifications-query.dto';
import type { GetNotificationsResult } from '../types/notification-list-item.type';

export const NOTIFICATIONS_REPOSITORY = Symbol('NOTIFICATIONS_REPOSITORY');

export interface NotificationsRepository {
  findNotifications(userId: string, query: GetNotificationsQuery): Promise<GetNotificationsResult>;
}
