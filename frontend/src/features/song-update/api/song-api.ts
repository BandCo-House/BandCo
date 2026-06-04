import { apiPatch } from '@/shared/api';
import type { Song } from '@/entities/song/model/types';

export interface UpdateSongRequest {
  title?: string;
  artistName?: string;
  sourceUrl?: string | null;
  memo?: string;
  status?: string;
}

export const updateSong = (
  songId: string,
  data: UpdateSongRequest,
): Promise<Song> => apiPatch<Song>(`/songs/${songId}`, data);
