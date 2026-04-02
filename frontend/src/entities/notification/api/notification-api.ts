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
    return parsed.data;
  };
