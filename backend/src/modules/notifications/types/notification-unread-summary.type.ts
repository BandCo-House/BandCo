import type { NotificationType } from '../../../generated/prisma';

export interface NotificationUnreadSummary {
  unreadCount: number;
  unreadByType: Record<NotificationType, number>;
}
