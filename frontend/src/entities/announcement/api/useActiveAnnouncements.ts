import { useQuery } from '@tanstack/react-query';
import { getActiveAnnouncements } from './announcement-api';

export const announcementKeys = {
  all: ['announcements'] as const,
  active: () => [...announcementKeys.all, 'active'] as const,
};

const ACTIVE_ANNOUNCEMENTS_INTERVAL_MS = 5 * 60 * 1000;

/**
 * 홈 상단에 띄울 활성 공지를 조회한다. 홈을 열어 둔 채여도 게시 종료·새 공지가 반영되도록 5분마다 다시 불러온다.
 */
export const useActiveAnnouncements = () =>
  useQuery({
    queryKey: announcementKeys.active(),
    queryFn: getActiveAnnouncements,
    staleTime: ACTIVE_ANNOUNCEMENTS_INTERVAL_MS,
    refetchInterval: ACTIVE_ANNOUNCEMENTS_INTERVAL_MS,
  });
