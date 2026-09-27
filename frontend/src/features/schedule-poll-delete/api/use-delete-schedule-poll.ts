import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { deleteSchedulePoll } from '@/entities/schedule-poll/api';
import { schedulePollQueries } from '@/entities/schedule-poll/model/queries';

/** 일정 조율 투표를 삭제하고 목록을 갱신한다. */
export const useDeleteSchedulePoll = (spaceId: string, pollId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteSchedulePoll(pollId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: schedulePollQueries.list(spaceId),
      });
    },
  });
};

/**
 * 삭제된 투표의 상세 캐시를 지운다(뒤로 가기로 남은 화면 방지).
 * 활성 구독이 남은 채 removeQueries를 부르면 다음 렌더에서 재요청이 나가 404를 만들 수 있어,
 * 호출부가 라우트 이탈을 끝낸 뒤에 부른다.
 */
export const removeSchedulePollDetailCache = (
  queryClient: QueryClient,
  pollId: string,
): void => {
  queryClient.removeQueries({ queryKey: schedulePollQueries.detail(pollId) });
};
