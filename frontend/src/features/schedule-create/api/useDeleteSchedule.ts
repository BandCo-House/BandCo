import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { deleteSchedule } from '@/entities/schedule/api';
import { scheduleQueries } from '@/entities/schedule/model/queries';

/**
 * 일정 삭제(DELETE /schedules/:id). 성공 시 목록 캐시만 무효화한다.
 * 상세 캐시까지 무효화하면 아직 열려 있는 상세 화면이 방금 지운 일정을 다시 조회해 404를 만든다.
 */
export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scheduleId: string) => deleteSchedule(scheduleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: scheduleQueries.all,
        predicate: (query) => query.queryKey[1] !== 'detail',
      });
    },
  });
};

/**
 * 삭제된 일정의 상세 캐시를 지운다(같은 ID로 다시 열렸을 때 지운 일정이 보이지 않게).
 * 활성 구독이 남은 채 removeQueries를 부르면 다음 렌더에서 재요청이 나가 404를 만들 수 있어,
 * 호출부가 상세 구독을 끊은 뒤에 부른다.
 */
export const removeScheduleDetailCache = (
  queryClient: QueryClient,
  scheduleId: string,
): void => {
  queryClient.removeQueries({ queryKey: scheduleQueries.detail(scheduleId) });
};
