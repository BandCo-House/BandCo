import { apiDelete, apiGet, apiPatch } from '@/shared/api';
import type {
  NotificationList,
  NotificationUnreadSummary,
} from '../model/types';
import {
  notificationListSchema,
  notificationUnreadSummarySchema,
} from '../model/schema';

export interface GetNotificationListParams {
  where__is_read?: boolean;
  where__type?: 'NOTICE' | 'INVITE' | 'REMINDER';
  take?: number;
  cursor__id?: string;
}

/**
 * 알림 목록을 조회한다(GET /notifications/me).
 */
export const getNotificationList = async (
  params?: GetNotificationListParams,
): Promise<NotificationList> => {
  const data = await apiGet<unknown>('/notifications/me', { params });
  return notificationListSchema.parse(data);
};

/**
 * 읽지 않은 알림 요약 정보를 조회한다(GET /notifications/unread-summary).
 */
export const getNotificationUnreadSummary =
  async (): Promise<NotificationUnreadSummary> => {
    const data = await apiGet<unknown>('/notifications/unread-summary');
    return notificationUnreadSummarySchema.parse(data);
  };

/**
 * 특정 알림을 읽음 상태로 변경합니다.
 */
export const markNotificationAsRead = async (notificationId: string) => {
  const sanitizedNotificationId = encodeURIComponent(notificationId.trim());

  if (!sanitizedNotificationId)
    throw new Error('유효한 notificationId가 필요합니다.');

  await apiPatch(`/notifications/${sanitizedNotificationId}/read`);
};

/**
 * 모든 알림을 읽음 상태로 변경합니다.
 */
export const markAllNotificationsAsRead = async () => {
  await apiPatch('/notifications/read-all');
};

/**
 * 다중 알림을 삭제합니다.
 */
export const deleteManyNotifications = async (
  notificationIds: string[],
): Promise<void> => {
  await apiDelete('/notifications', { data: { notificationIds } });
};
