import { apiPost } from '@/shared/api';
import type { Song } from '@/entities/song/model/types';

export interface CreateSongRequest {
  title: string;
  artistName: string;
  sourceUrl?: string | null;
  sourceType?: string | null;
  memo?: string;
  status?: string;
}

export const createSong = (
  bandId: string,
  data: CreateSongRequest,
): Promise<Song> => apiPost<Song>(`/songs/${bandId}`, data);
