import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSchedulePoll } from '@/entities/schedule-poll/api';
import { schedulePollQueries } from '@/entities/schedule-poll/model/queries';
import type { CreateSchedulePollRequest } from '@/entities/schedule-poll/model/types';

/** 일정 조율 투표를 생성하고 목록을 갱신한다. */
export const useCreateSchedulePoll = (spaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateSchedulePollRequest) =>
      createSchedulePoll(spaceId, body),
    onSuccess: (created) => {
      queryClient.setQueryData(
        schedulePollQueries.detail(created.schedulePollId),
        created,
      );
      void queryClient.invalidateQueries({
        queryKey: schedulePollQueries.list(spaceId),
      });
    },
  });
};
