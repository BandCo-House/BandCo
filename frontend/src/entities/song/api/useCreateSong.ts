import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateSongRequest } from '../model/types';
import { createSong } from './song-api';
import { songKeys } from './useBandSongs';

/**
 * 밴드 라이브러리에 합주곡을 추가한다.
 * 성공 시 곡 목록을 무효화해 라이브러리·일정 폼의 곡 선택지가 같이 갱신되게 한다.
 */
export const useCreateSong = (bandId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSongRequest) => createSong(bandId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};
