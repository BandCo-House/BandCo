import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveBand } from './band-api';
import { bandDetailKeys } from './useBand';
import { bandKeys } from './useBands';

/**
 * 밴드에서 나간다.
 * 목록뿐 아니라 상세 캐시도 지운다 — 나간 밴드의 상세가 남아 있으면
 * 뒤로 가기로 돌아왔을 때 접근 권한이 없는 화면이 그대로 보인다.
 */
export const useLeaveBand = (bandId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => leaveBand(bandId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bandKeys.all });
      queryClient.removeQueries({ queryKey: bandDetailKeys.detail(bandId) });
    },
  });
};
