import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSchedule } from '@/entities/schedule/api';
import { scheduleQueries } from '@/entities/schedule/model/queries';
import type { CreateScheduleRequest } from '@/entities/schedule/model/types';

/** 일정 생성(POST /bandspaces/:spaceId/schedules). 성공 시 일정 목록 캐시를 무효화한다. */
export const useCreateSchedule = (spaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateScheduleRequest) => createSchedule(spaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleQueries.all });
    },
  });
};
