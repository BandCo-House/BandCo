import type { PaginationResult } from '../../../common/pagination';
import type { NotificationListType } from '../dto/get-notifications-query.dto';

export interface NotificationListItem {
  notificationId: string;
  type: NotificationListType;
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
