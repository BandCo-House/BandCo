import type { PaginationResult } from '../../../common/pagination';
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

export interface GetNotificationsResult {
  items: NotificationListItem[];
  pagination: PaginationResult;
}
