import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSong } from './song-api';
import { songKeys } from './useBandSongs';

/**
 * 밴드 합주곡을 삭제한다.
 * 성공 시 곡 목록을 무효화해 라이브러리 및 관련 화면이 갱신되게 한다.
 */
export const useDeleteSong = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (songId: string) => deleteSong(songId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};
