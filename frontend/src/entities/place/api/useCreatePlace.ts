import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPlace, type CreatePlaceRequest } from './place-api';
import { placeKeys } from './useBandPlaces';

/**
 * 밴드 연습 장소를 생성한다. 성공 시 해당 밴드의 장소 목록을 무효화한다.
 */
export const useCreatePlace = (bandId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlaceRequest) => createPlace(bandId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: placeKeys.all });
    },
  });
};
