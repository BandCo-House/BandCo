import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSchedule } from '@/entities/schedule/api';
import { scheduleQueries } from '@/entities/schedule/model/queries';
import type { UpdateScheduleRequest } from '@/entities/schedule/model/types';

/** 일정 수정(PATCH /schedules/:id). 성공 시 목록과 해당 상세 캐시를 무효화한다. */
export const useUpdateSchedule = (scheduleId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateScheduleRequest) =>
      updateSchedule(scheduleId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleQueries.all });
      if (scheduleId) {
        queryClient.invalidateQueries({
          queryKey: scheduleQueries.detail(scheduleId),
        });
      }
    },
  });
};
