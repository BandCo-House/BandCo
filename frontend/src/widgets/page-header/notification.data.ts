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
};

export const notificationPreviews: NotificationPreview[] = [
  {
    notificationId: 'notice-1',
    type: 'NOTICE',
    title: '합주방 공지 업데이트',
    description: '이번 주 합주실 사용 공지가 새로 등록되었어요.',
    isRead: false,
  },
  {
    notificationId: 'invite-indie',
    type: 'INVITE',
    title: '인디 밴드 초대장 도착!',
    description: '밴드에 참여하려면 초대를 확인해 주세요.',
    isRead: false,
  },
  {
    notificationId: 'invite-sinsa',
    type: 'INVITE',
    title: '신촌 락밴드 초대장 도착!',
    description: '새 밴드 초대가 도착했어요. 내용을 확인해 주세요.',
    isRead: true,
  },
  {
    notificationId: 'reminder-1',
    type: 'REMINDER',
    title: '합주 일정 임박',
    description: '내일 저녁 8시에 합주 일정이 있어요.',
    isRead: false,
  },
];

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
): NotificationUnreadByType => ({
  NOTICE: notifications.filter(
    (notification) => notification.type === 'NOTICE' && !notification.isRead,
  ).length,
  INVITE: notifications.filter(
    (notification) => notification.type === 'INVITE' && !notification.isRead,
  ).length,
  REMINDER: notifications.filter(
    (notification) => notification.type === 'REMINDER' && !notification.isRead,
  ).length,
});

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
