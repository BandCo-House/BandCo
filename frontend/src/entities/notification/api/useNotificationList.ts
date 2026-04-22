import { useQuery } from '@tanstack/react-query';
import { getNotificationList } from './notification-api';
import { notificationQueries } from './useNotificationUnreadSummary';

/**
 * 홈 알림 시트에서 사용하는 알림 목록을 조회합니다.
 */
export const useNotificationList = () => {
  return useQuery({
    queryKey: notificationQueries.list(),
    queryFn: getNotificationList,
  });
};
