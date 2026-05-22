import type { NotificationType } from '../../../generated/prisma';

export interface MarkNotificationReadResult {
  notificationId: string;
  type: NotificationType;
  title: string;
  description: string;
  isRead: boolean;
  targetPath: string;
  createdAt: string;
}
