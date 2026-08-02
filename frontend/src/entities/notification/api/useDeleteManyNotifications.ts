import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteManyNotifications } from './notification-api';
import { notificationQueries } from './useNotificationUnreadSummary';

/**
 * 선택된 여러 알림들을 일괄 삭제하고, 관련 쿼리 캐시를 최신 상태로 새로고침합니다.
 */
export const useDeleteManyNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteManyNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueries.list() });
      queryClient.invalidateQueries({
        queryKey: notificationQueries.unreadBadge(),
      });
    },
  });
};
