export type NotificationType = 'INVITE' | 'NOTICE' | 'REMINDER';

/** 개별·전체 알림 발송 요청 본문 */
export interface SendNotificationRequest {
  title: string;
  description?: string;
  targetPath?: string;
}

export interface NotificationIdResult {
  notificationId: string;
}

export interface BroadcastResult {
  sentCount: number;
}
