import { useMutation } from '@tanstack/react-query';
import type { Schedule } from '@/entities/schedule/model/types';

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
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('일정 생성에 실패했습니다.');
      }

      return response.json();
    },
  });
};
