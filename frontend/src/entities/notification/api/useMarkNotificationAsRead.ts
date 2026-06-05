import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markNotificationAsRead } from './notification-api';
import { notificationQueries } from './useNotificationUnreadSummary';
import type {
  NotificationType,
  NotificationUnreadSummary,
} from '../model/types';

/**
 * 개별 알림을 읽음 처리하고 unread summary 캐시를 동기화합니다.
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notificationId,
    }: {
      notificationId: string;
      type: NotificationType;
    }) => markNotificationAsRead(notificationId),
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<NotificationUnreadSummary | undefined>(
        notificationQueries.unreadSummary(),
        (current) => {
          if (!current) return current;

          return {
            unreadCount: Math.max(current.unreadCount - 1, 0),
            unreadByType: {
              ...current.unreadByType,
              [variables.type]: Math.max(
                current.unreadByType[variables.type] - 1,
                0,
              ),
            },
          };
        },
      );
    },
  });
};
