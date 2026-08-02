import { useQuery } from '@tanstack/react-query';
import {
  getNotificationUnreadSummary,
  getUnreadNotificationBadge,
} from './notification-api';

export const notificationQueries = {
  all: ['notifications'] as const,
  list: () => [...notificationQueries.all, 'list'] as const,
  unreadSummary: () => [...notificationQueries.all, 'unread-summary'] as const,
  unreadBadge: () => [...notificationQueries.all, 'unread-badge'] as const,
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

/**
 * 뱃지용으로 안 읽은 알림의 요약 카운트(최대 10개 조회)를 가져옵니다.
 */
export const useNotificationUnreadBadge = () => {
  return useQuery({
    queryKey: notificationQueries.unreadBadge(),
    queryFn: getUnreadNotificationBadge,
    refetchInterval: 30000, // 30초 폴링
  });
};
