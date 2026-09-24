import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSchedulePoll } from '@/entities/schedule-poll/api';
import { schedulePollQueries } from '@/entities/schedule-poll/model/queries';

/** 일정 조율 투표를 삭제하고 목록을 갱신한다. */
export const useDeleteSchedulePoll = (spaceId: string, pollId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteSchedulePoll(pollId),
    onSuccess: () => {
      // 삭제된 투표는 더 이상 볼 수 없으므로 상세 캐시를 지운다(뒤로 가기로 남은 화면 방지).
      queryClient.removeQueries({
        queryKey: schedulePollQueries.detail(pollId),
      });
      void queryClient.invalidateQueries({
        queryKey: schedulePollQueries.list(spaceId),
      });
    },
  });
};
