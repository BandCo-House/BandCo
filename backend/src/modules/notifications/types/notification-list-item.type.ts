import type { NotificationType } from '../../../generated/prisma';

export interface NotificationListItem {
  notificationId: string;
  type: NotificationType;
  title: string;
  description: string;
  isRead: boolean;
  targetPath: string;
  createdAt: string;
}

export interface NotificationListMeta {
  count: number;
  take: number;
  next: string | null;
}

export interface GetNotificationsResult {
  items: NotificationListItem[];
  meta: NotificationListMeta;
}
