import { apiGet } from '@/shared/api';
import type { Song } from '@/entities/song/model/types';

export interface GetSongsParams {
  query?: string;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const getSongs = (
  bandId: string,
  params?: GetSongsParams,
): Promise<Song[]> =>
  apiGet<Song[]>(`/songs/${bandId}`, {
    params,
  });
