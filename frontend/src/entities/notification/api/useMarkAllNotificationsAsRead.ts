import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markAllNotificationsAsRead } from './notification-api';
import { notificationQueries } from './useNotificationUnreadSummary';
import type { NotificationUnreadSummary } from '../model/types';

/**
 * 전체 알림을 읽음 처리하고 unread summary 캐시를 초기화합니다.
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.setQueryData<NotificationUnreadSummary | undefined>(
        notificationQueries.unreadSummary(),
        (current) => {
          if (!current) return current;

          return {
            unreadCount: 0,
            unreadByType: Object.fromEntries(
              Object.keys(current.unreadByType).map((key) => [key, 0]),
            ) as NotificationUnreadSummary['unreadByType'],
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: notificationQueries.all });
    },
  });
};
