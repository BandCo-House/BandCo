export interface UnreadNotificationsByType {
  INVITE: number;
  NOTICE: number;
  REMINDER: number;
}

export interface UnreadNotificationCountResult {
  unreadCount: number;
  unreadByType: UnreadNotificationsByType;
}
