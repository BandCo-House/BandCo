import { apiGet } from '@/shared/api';
import type { Song } from '@/entities/song/model/types';

export const getSong = (songId: string): Promise<Song> =>
  apiGet<Song>(`/songs/${songId}`);
