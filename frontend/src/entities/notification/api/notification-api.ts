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
 * 뱃지용으로 읽지 않은 알림을 최대 10개 조회합니다. (백엔드 추가 엔드포인트 없음)
 */
export const getUnreadNotificationBadge = async (): Promise<{
  count: number;
  hasMore: boolean;
}> => {
  const data = await getNotificationList({
    where__is_read: false,
    take: 10,
  });
  return {
    count: data.items.length,
    hasMore: data.meta.next !== null,
  };
};

/**
 * 읽지 않은 알림 요약 정보를 조회한다.
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
