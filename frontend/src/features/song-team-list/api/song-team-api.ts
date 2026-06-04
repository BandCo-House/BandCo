import { apiGet } from '@/shared/api';
import type { SongTeam } from '@/entities/song-team/model/types';

export interface GetSongTeamsParams {
  page?: number;
  size?: number;
  sort?: string;
}

export const getSongTeams = (
  songId: string,
  params?: GetSongTeamsParams,
): Promise<SongTeam[]> =>
  apiGet<SongTeam[]>(`/songs/teams/${songId}`, {
    params,
  });
