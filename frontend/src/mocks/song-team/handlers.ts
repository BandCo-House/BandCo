import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { SongTeam } from '@/entities/song-team/model/types';
import { API_URL } from '../config';

const songTeams: SongTeam[] = [
  {
    id: 'team-1',
    songId: 'song-1',
    name: '듀얼 기타 편성',
    memberCount: 5,
  },
];

export const songTeamHandlers = [
  http.get(`${API_URL}/songs/teams/:songId`, () => {
    return HttpResponse.json<ApiResponse<SongTeam[]>>({
      success: true,
      data: songTeams,
    });
  }),
];
