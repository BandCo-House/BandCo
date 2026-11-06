import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateSongRequest } from '../model/types';
import { updateSong } from './song-api';
import { songKeys } from './useBandSongs';

/**
 * 합주곡 정보를 수정한다.
 * 성공 시 곡 목록을 무효화해 라이브러리 및 상세가 갱신되게 한다.
 */
export const useUpdateSong = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      songId,
      data,
    }: {
      songId: string;
      data: UpdateSongRequest;
    }) => updateSong(songId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};
