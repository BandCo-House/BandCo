import type {
  NotificationType,
  NotificationUnreadByType,
} from '@/entities/notification/model/types';

export type NotificationPreview = {
  notificationId: string;
  type: NotificationType;
  title: string;
  description: string;
  isRead: boolean;
  targetPath?: string;
};

export const notificationTypeFilters: NotificationType[] = ['NOTICE', 'INVITE', 'REMINDER'];

/**
 * 서버에서 내려오는 알림 타입을 시트 탭용 한글 레이블로 변환한다.
 */
export const translateNotificationType = (type: NotificationType) => {
  switch (type) {
    case 'NOTICE':
      return '공지';
    case 'INVITE':
      return '초대장';
    case 'REMINDER':
      return '일정';
  }
};

/**
 * 전체 알림 목록에서 읽지 않은 알림 수를 계산한다.
 */
export const getUnreadNotificationsCount = (
  notifications: NotificationPreview[],
) => notifications.filter((notification) => !notification.isRead).length;

/**
 * 특정 타입 탭에 읽지 않은 알림이 남아 있는지 확인한다.
 */
export const hasUnreadNotificationsByType = (
  notifications: NotificationPreview[],
  type: NotificationType,
) =>
  notifications.some(
    (notification) => notification.type === type && !notification.isRead,
  );

/**
 * 샘플 알림 목록으로 unreadByType 형태의 요약 값을 만든다.
 */
export const buildUnreadByTypeFromNotifications = (
  notifications: NotificationPreview[],
): NotificationUnreadByType =>
  notifications.reduce<NotificationUnreadByType>(
    (summary, notification) => {
      if (!notification.isRead) {
        summary[notification.type] += 1;
      }

      return summary;
    },
    {
      NOTICE: 0,
      INVITE: 0,
      REMINDER: 0,
    },
  );

/**
 * 미리보기 목록에서 특정 알림을 읽음 상태로 갱신합니다.
 */
export const markNotificationPreviewAsRead = (
  notifications: NotificationPreview[],
  notificationId: string,
) =>
  notifications.map((notification) =>
    notification.notificationId === notificationId
      ? { ...notification, isRead: true }
      : notification,
  );
