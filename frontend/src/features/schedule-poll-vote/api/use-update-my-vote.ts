import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMySchedulePollVote } from '@/entities/schedule-poll/api';
import { schedulePollQueries } from '@/entities/schedule-poll/model/queries';

/** 내 투표를 전량 교체하고 상세·목록 캐시를 갱신한다. */
export const useUpdateMySchedulePollVote = (pollId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (schedulePollOptionIds: string[]) =>
      updateMySchedulePollVote(pollId, { schedulePollOptionIds }),
    onSuccess: (updated) => {
      // 응답이 상세 조회와 같은 형태라 재요청 없이 바로 반영한다.
      queryClient.setQueryData(schedulePollQueries.detail(pollId), updated);
      // 목록의 참여 인원·hasVoted도 함께 갱신한다.
      void queryClient.invalidateQueries({
        queryKey: schedulePollQueries.list(updated.bandSpaceId),
      });
    },
  });
};
