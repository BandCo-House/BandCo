import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAllNotifications } from './notification-api';
import { notificationQueries } from './useNotificationUnreadSummary';

/**
 * 내 알림을 모두 삭제한다. 목록은 페이지 단위로 불러오므로, 불러온 것만 지우는
 * 다건 삭제로는 "전체"가 되지 않는다. 서버의 전체 삭제를 쓴다.
 */
export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueries.list() });
      queryClient.invalidateQueries({
        queryKey: notificationQueries.unreadSummary(),
      });
    },
  });
};
