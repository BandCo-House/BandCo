import type { NotificationReferenceType, NotificationType } from '../../../generated/prisma';

export interface NotificationSender {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
}

export interface NotificationReference {
  type: NotificationReferenceType;
  id: string;
  status: string;
  sender: NotificationSender | null;
}

export interface NotificationListItem {
  notificationId: string;
  type: NotificationType;
  title: string;
  description: string;
  isRead: boolean;
  targetPath: string;
  reference: NotificationReference | null;
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
