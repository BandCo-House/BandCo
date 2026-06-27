import { useQuery } from '@tanstack/react-query';
import { getBandNotices } from './notice-api';

export const noticeKeys = {
  all: ['notices'] as const,
  list: (bandId: string, size: number) =>
    [...noticeKeys.all, 'list', bandId, size] as const,
};

export const useBandNotices = (bandId: string, size: number) =>
  useQuery({
    queryKey: noticeKeys.list(bandId, size),
    queryFn: () => getBandNotices(bandId, { size }),
    enabled: !!bandId,
  });
