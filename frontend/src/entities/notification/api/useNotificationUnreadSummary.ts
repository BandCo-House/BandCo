import { useQuery } from '@tanstack/react-query';
import { getNotificationUnreadSummary } from './notification-api';

export const notificationQueries = {
  all: ['notifications'] as const,
  list: () => [...notificationQueries.all, 'list'] as const,
  unreadSummary: () => [...notificationQueries.all, 'unread-summary'] as const,
};

/**
 * 헤더 badge와 탭 unread 표시를 위한 알림 요약 정보를 조회한다.
 */
export const useNotificationUnreadSummary = () => {
  return useQuery({
    queryKey: notificationQueries.unreadSummary(),
    queryFn: getNotificationUnreadSummary,
  });
};
