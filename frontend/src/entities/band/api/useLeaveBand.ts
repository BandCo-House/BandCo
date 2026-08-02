import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveBand } from './band-api';
import { bandKeys } from './useBands';

/** 밴드에서 나간다. 성공하면 내 밴드 목록이 바뀌므로 목록을 무효화한다. */
export const useLeaveBand = (bandId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => leaveBand(bandId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bandKeys.all });
    },
  });
};
