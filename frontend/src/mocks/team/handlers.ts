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

  http.get(`${API_URL}/teams/:teamId`, ({ params }) => {
    const { teamId } = params as { teamId: string };
    return HttpResponse.json({
      success: true,
      data: {
        teamId,
        bandId: 'band-1',
        name: '보컬팀',
        description: '여자 보컬 중심 팀',
        status: 'ACTIVE',
        teamCoverUrl: null,
        teamLeader: { userId: 'user-1', nickname: 'Jun' },
        memberCount: 4,
        createdAt: '2026-05-01T12:00:00Z',
        updatedAt: '2026-05-01T12:00:00Z',
      },
    });
  }),

  http.delete(`${API_URL}/teams/:teamId`, ({ params }) => {
    const { teamId } = params as { teamId: string };
    return HttpResponse.json({
      success: true,
      data: { teamId, deleted: true },
    });
  }),

  http.get(`${API_URL}/teams/:teamId/members`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: [
          {
            teamMemberId: 'tm-1',
            bandMemberId: 'bm-1',
            user: { userId: 'u-1', nickname: '김기타', profileImageUrl: null },
            teamRole: 'LEADER',
            joinedAt: '2026-05-01T12:00:00Z',
            sessionName: '기타',
          },
          {
            teamMemberId: 'tm-2',
            bandMemberId: 'bm-2',
            user: { userId: 'u-2', nickname: '이베이스', profileImageUrl: null },
            teamRole: 'MEMBER',
            joinedAt: '2026-05-02T12:00:00Z',
            sessionName: '베이스',
          },
          {
            teamMemberId: 'tm-3',
            bandMemberId: 'bm-3',
            user: { userId: 'u-3', nickname: '박드럼', profileImageUrl: null },
            teamRole: 'MEMBER',
            joinedAt: '2026-05-03T12:00:00Z',
            sessionName: '드럼',
          },
          {
            teamMemberId: 'tm-4',
            bandMemberId: 'bm-4',
            user: { userId: 'u-4', nickname: '최건반', profileImageUrl: null },
            teamRole: 'MEMBER',
            joinedAt: '2026-05-04T12:00:00Z',
            sessionName: '건반',
          },
        ],
      },
    });
  }),

  http.post(`${API_URL}/teams/:teamId/members`, async ({ request }) => {
    const body = (await request.json()) as { bandMemberId: string };
    return HttpResponse.json({
      success: true,
      data: {
        teamMemberId: `tm-${Date.now()}`,
        teamId: 'team-1',
        bandMemberId: body.bandMemberId,
        user: { userId: 'u-new', nickname: '신규멤버', profileImageUrl: null },
        teamRole: 'MEMBER',
        joinedAt: new Date().toISOString(),
      },
    });
  }),

  http.delete(`${API_URL}/teams/:teamId/members/:teamMemberId`, ({ params }) => {
    const { teamMemberId } = params as { teamMemberId: string };
    return HttpResponse.json({
      success: true,
      data: { teamMemberId, removed: true },
    });
  }),
];

