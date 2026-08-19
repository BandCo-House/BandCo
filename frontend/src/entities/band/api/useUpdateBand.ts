import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateBandRequest } from '../model/types';
import { updateBand } from './band-api';
import { bandDetailKeys } from './useBand';
import { bandKeys } from './useBands';

/**
 * 밴드 정보를 수정한다.
 * 밴드명·공개 여부는 헤더와 밴드 목록에도 노출되므로 상세와 목록을 함께 무효화한다.
 */
export const useUpdateBand = (bandId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateBandRequest) => updateBand(bandId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: bandDetailKeys.detail(bandId),
      });
      void queryClient.invalidateQueries({ queryKey: bandKeys.all });
    },
  });
};
