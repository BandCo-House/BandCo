import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSpace, type UpdateSpaceRequest } from './space-api';
import { spaceKeys } from './useBandSpaces';
import { spaceDetailKeys } from './useSpace';

/**
 * 합주 공간을 수정한다. 성공 시 공간 목록(카드의 이름·D-day)과 이 공간의 상세를 무효화한다.
 */
export const useUpdateSpace = (spaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSpaceRequest) => updateSpace(spaceId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: spaceKeys.all });
      void queryClient.invalidateQueries({
        queryKey: spaceDetailKeys.detail(spaceId),
      });
    },
  });
};
