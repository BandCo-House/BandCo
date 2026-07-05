import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { BandTeamListItem } from '@/entities/team/model/types';
import { API_URL } from '../config';

// 밴드 팀 목록 mock (GET /bands/:bandId/teams)
const TEAM_FIXTURES = [
  { name: '듀얼 기타', memberCount: 2 },
  { name: '듀얼 보컬', memberCount: 2 },
  { name: '리듬 세션', memberCount: 3 },
];

const buildBandTeams = (): BandTeamListItem[] =>
  TEAM_FIXTURES.map((fixture, i) => ({
    teamId: `team-${i + 1}`,
    name: fixture.name,
    description: null,
    status: 'ACTIVE',
    teamCoverUrl: null,
    memberCount: fixture.memberCount,
    teamLeader: null,
    createdAt: '2026-05-01T00:00:00+09:00',
  }));

export const teamHandlers = [
  http.get(`${API_URL}/bands/:bandId/teams`, ({ params }) => {
    const { bandId } = params as { bandId: string };
    const items = buildBandTeams();

    return HttpResponse.json<
      ApiResponse<{ bandId: string; items: BandTeamListItem[]; meta: unknown }>
    >({
      success: true,
      data: {
        bandId,
        items,
        meta: { count: items.length, take: 20, cursor: null, next: null },
      },
    });
  }),
];
