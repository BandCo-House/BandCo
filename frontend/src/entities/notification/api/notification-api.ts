import { apiClient } from '@/shared/api';
import type {
  NotificationList,
  NotificationUnreadSummary,
} from '../model/types';
import {
  notificationListResponseSchema,
  notificationUnreadSummaryResponseSchema,
} from '../model/schema';

export interface GetNotificationListParams {
  where__is_read?: boolean;
  where__type?: 'NOTICE' | 'INVITE' | 'REMINDER';
  take?: number;
  cursor__id?: string;
}

/**
 * 알림 목록을 조회한다.
 */
export const getNotificationList = async (
  params?: GetNotificationListParams,
): Promise<NotificationList> => {
  const response = await apiClient.get('/notifications/me', { params });
  const parsed = notificationListResponseSchema.parse(response.data);

  if (parsed.status === 'error') throw new Error(parsed.message);

  return parsed.data;
};

/**
 * 읽지 않은 알림 요약 정보를 조회한다(GET /notifications/unread-summary).
 */
export const getNotificationUnreadSummary =
  async (): Promise<NotificationUnreadSummary> => {
    const response = await apiClient.get('/notifications/unread-summary');
    const parsed = notificationUnreadSummaryResponseSchema.parse(response.data);
    if (parsed.status === 'error') throw new Error(parsed.message);

    return parsed.data;
  };

/**
 * 특정 알림을 읽음 상태로 변경합니다.
 */
export const markNotificationAsRead = async (notificationId: string) => {
  const sanitizedNotificationId = encodeURIComponent(notificationId.trim());

  if (!sanitizedNotificationId)
    throw new Error('유효한 notificationId가 필요합니다.');

  await apiClient.patch(`/notifications/${sanitizedNotificationId}/read`);
};

/**
 * 모든 알림을 읽음 상태로 변경합니다.
 */
export const markAllNotificationsAsRead = async () => {
  await apiClient.patch('/notifications/read-all');
};

/**
 * 다중 알림을 삭제합니다.
 */
export const deleteManyNotifications = async (
  notificationIds: string[],
): Promise<void> => {
  await apiClient.delete('/notifications', { data: { notificationIds } });
};
