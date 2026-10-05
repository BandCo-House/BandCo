import { useQuery } from '@tanstack/react-query';
import { getActiveAnnouncements } from './announcement-api';

export const announcementKeys = {
  all: ['announcements'] as const,
  active: () => [...announcementKeys.all, 'active'] as const,
};

export const useActiveAnnouncements = () =>
  useQuery({
    queryKey: announcementKeys.active(),
    queryFn: getActiveAnnouncements,
    staleTime: 5 * 60 * 1000,
  });
