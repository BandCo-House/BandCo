import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePlace } from './place-api';
import { placeKeys } from './useBandPlaces';

/** 연습 장소를 삭제한다. 성공 시 장소 목록을 무효화한다. */
export const useDeletePlace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (placeId: string) => deletePlace(placeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: placeKeys.all });
    },
  });
};
