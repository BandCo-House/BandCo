import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSpace, type CreateSpaceRequest } from './space-api';
import { spaceKeys } from './useBandSpaces';

/**
 * 밴드 합주 공간을 생성한다. 성공 시 해당 밴드의 공간 목록을 무효화한다.
 */
export const useCreateSpace = (bandId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSpaceRequest) => createSpace(bandId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: spaceKeys.all });
    },
  });
};
