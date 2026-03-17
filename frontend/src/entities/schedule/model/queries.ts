import { useQuery } from '@tanstack/react-query';
import { getSchedules } from '../api';
import { splitSchedule, type SchedulePart } from '../lib/split-schedule';

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
      return data.items.flatMap((item) => splitSchedule(item));
    },
    enabled: !!spaceId && !!from && !!to,
  });
};
