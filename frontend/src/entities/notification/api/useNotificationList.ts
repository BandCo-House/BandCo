import { useInfiniteQuery } from '@tanstack/react-query';
import { getNotificationList } from './notification-api';
import { notificationQueries } from './useNotificationUnreadSummary';

/**
 * 알림 목록을 무한 스크롤(Cursor 페이징) 형태로 조회합니다.
 */
export const useNotificationList = (params?: { where__is_read?: boolean }) => {
  return useInfiniteQuery({
    queryKey: [...notificationQueries.list(), params],
    queryFn: ({ pageParam }) =>
      getNotificationList({
        ...params,
        cursor__id: pageParam || undefined,
        take: 10,
      }),
    initialPageParam: '',
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta.next) return undefined;
      try {
        const url = new URL(lastPage.meta.next, window.location.origin);
        return url.searchParams.get('cursor__id') ?? undefined;
      } catch {
        return undefined;
      }
    },
  });
};
