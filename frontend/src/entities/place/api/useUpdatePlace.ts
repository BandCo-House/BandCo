import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePlace, type UpdatePlaceRequest } from './place-api';
import { placeKeys } from './useBandPlaces';

/**
 * 연습 장소를 수정한다. 성공 시 장소 목록을 무효화해 카드·상세가 새 값으로 바뀐다.
 */
export const useUpdatePlace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      placeId,
      data,
    }: {
      placeId: string;
      data: UpdatePlaceRequest;
    }) => updatePlace(placeId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: placeKeys.all });
    },
  });
};
