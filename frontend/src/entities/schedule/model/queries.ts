import { useQuery } from '@tanstack/react-query';
import { getSchedules } from '../api';
import { splitSchedule, type SchedulePart } from '../lib/split-schedule';
import { calculateOverlaps } from '../lib/calculate-overlaps';

export const scheduleQueries = {
  all: ['schedules'] as const,
  list: (spaceId: string, from: string, to: string) =>
    [...scheduleQueries.all, 'list', spaceId, { from, to }] as const,
};

export const useSchedules = (
  spaceId: string,
  from: string,
  to: string,
) => {
  return useQuery({
    queryKey: scheduleQueries.list(spaceId, from, to),
    queryFn: () => getSchedules(spaceId, { from, to }),
    select: (data): SchedulePart[] => {
      // 1. 일정을 자정 기준으로 분리
      const allParts = data.items.flatMap((item) => splitSchedule(item));

      // 2. 날짜별로 그룹화하여 겹침 계산 적용
      const partsByDate: Record<string, SchedulePart[]> = {};
      allParts.forEach((part) => {
        if (!partsByDate[part.date]) partsByDate[part.date] = [];
        partsByDate[part.date].push(part);
      });

      return Object.values(partsByDate).flatMap((parts) =>
        calculateOverlaps(parts),
      );
    },
    enabled: !!spaceId && !!from && !!to,
  });
};
