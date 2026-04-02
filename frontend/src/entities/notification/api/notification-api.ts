import { apiClient } from '@/shared/api';
import type { NotificationUnreadSummary } from '../model/types';
import { notificationUnreadSummaryResponseSchema } from '../model/schema';

/**
 * 읽지 않은 알림 요약 정보를 조회한다.
 */
export const getNotificationUnreadSummary =
  async (): Promise<NotificationUnreadSummary> => {
    const response = await apiClient.get('/notifications/unread-summary');
    const parsed = notificationUnreadSummaryResponseSchema.parse(response.data);
    if (parsed.status === 'error') {
      throw new Error(parsed.message);
    }
    return parsed.data;
  };

/**
 * 특정 알림을 읽음 상태로 변경합니다.
 */
export const markNotificationAsRead = async (notificationId: string) => {
  const sanitizedNotificationId = encodeURIComponent(notificationId.trim());

  if (!sanitizedNotificationId) {
    throw new Error('유효한 notificationId가 필요합니다.');
  }

  await apiClient.patch(`/notifications/${sanitizedNotificationId}/read`);
};

/**
 * 모든 알림을 읽음 상태로 변경합니다.
 */
export const markAllNotificationsAsRead = async () => {
  await apiClient.patch('/notifications/read-all');
};
