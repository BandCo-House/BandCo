import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateScheduleRequest, ScheduleItem } from '@/entities/schedule/model/types';
import { apiPost } from '@/shared/api';

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateScheduleRequest): Promise<ScheduleItem> => {
      return apiPost<ScheduleItem>('/schedule', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};
