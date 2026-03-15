import { useMutation } from '@tanstack/react-query';
import type { Schedule } from '@/entities/schedule/model/types';
import { apiPost } from '@/shared/api';

export type CreateSchedulePayload =
  | Omit<
      Extract<Schedule, { type: 'ensemble' }>,
      'id' | 'createdAt' | 'updatedAt'
    >
  | Omit<
      Extract<Schedule, { type: 'meeting' }>,
      'id' | 'createdAt' | 'updatedAt'
    >;

export const useCreateSchedule = () => {
  return useMutation({
    mutationFn: async (data: CreateSchedulePayload): Promise<Schedule> => {
      return apiPost<Schedule>('/schedule', data);
    },
  });
};
