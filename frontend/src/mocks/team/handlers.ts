import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { BandTeamListItem } from '@/entities/team/model/types';
import { API_URL } from '../config';
import { BAND_MEMBERS } from '../member/handlers';

// ── 인메모리 밴드 팀 스토어 ──────────────────────────────────────────
type StoreBandTeam = BandTeamListItem;

const INITIAL_TEAMS: StoreBandTeam[] = [
  {
    teamId: 'team-1',
    name: '듀얼 기타 편성',
    description: '기타 2인 중심 편성 팀',
    status: 'ACTIVE',
    teamCoverUrl: null,
    memberCount: 2,
    teamLeader: { userId: 'user-1', nickname: '김민준' },
    createdAt: '2026-05-01T00:00:00+09:00',
  },
  {
    teamId: 'team-2',
    name: '듀얼 보컬 편성',
    description: '남녀 듀엣 보컬 중심 팀',
    status: 'ACTIVE',
    teamCoverUrl: null,
    memberCount: 2,
    teamLeader: { userId: 'user-2', nickname: '박지은' },
    createdAt: '2026-05-02T00:00:00+09:00',
  },
  {
    teamId: 'team-3',
    name: '리듬 세션 편성',
    description: '베이스, 드럼, 건반 중심 팀',
    status: 'ACTIVE',
    teamCoverUrl: null,
    memberCount: 3,
    teamLeader: { userId: 'user-3', nickname: '이준호' },
    createdAt: '2026-05-03T00:00:00+09:00',
  },
];

let bandTeamsStore = [...INITIAL_TEAMS];

// ── 인메모리 팀 멤버 스토어 ──────────────────────────────────────────
type StoreMember = {
  teamMemberId: string;
  bandMemberId: string;
  user: { userId: string; nickname: string; profileImageUrl: string | null };
  teamRole: string;
  joinedAt: string;
  skills: { skillTypeId: string; skillName: string; skillLevel: string; isPrimary: boolean }[];
};

const teamMemberStore = new Map<string, StoreMember[]>([
  [
    'team-1', // 듀얼 기타 편성
    [
      {
        teamMemberId: 'tm-1-1',
        bandMemberId: 'member-1',
        user: { userId: 'user-1', nickname: '김민준', profileImageUrl: null },
        teamRole: 'LEADER',
        joinedAt: '2026-05-01T12:00:00Z',
        skills: [
          { skillTypeId: 'vocal-1', skillName: '보컬', skillLevel: 'ADVANCED', isPrimary: true },
          { skillTypeId: 'guitar-1', skillName: '기타', skillLevel: 'INTERMEDIATE', isPrimary: false },
        ],
      },
      {
        teamMemberId: 'tm-1-2',
        bandMemberId: 'member-2',
        user: { userId: 'user-2', nickname: '박민준', profileImageUrl: null },
        teamRole: 'MEMBER',
        joinedAt: '2026-05-01T12:30:00Z',
        skills: [
          { skillTypeId: 'guitar-2', skillName: '기타2', skillLevel: 'ADVANCED', isPrimary: true },
        ],
      },
    ],
  ],
  [
    'team-2', // 듀얼 보컬 편성
    [
      {
        teamMemberId: 'tm-2-1',
        bandMemberId: 'member-3',
        user: { userId: 'user-3', nickname: '박지은', profileImageUrl: null },
        teamRole: 'LEADER',
        joinedAt: '2026-05-02T12:00:00Z',
        skills: [
          { skillTypeId: 'vocal-1', skillName: '보컬', skillLevel: 'ADVANCED', isPrimary: true },
        ],
      },
      {
        teamMemberId: 'tm-2-2',
        bandMemberId: 'member-4',
        user: { userId: 'user-4', nickname: '이서연', profileImageUrl: null },
        teamRole: 'MEMBER',
        joinedAt: '2026-05-02T13:00:00Z',
        skills: [
          { skillTypeId: 'vocal-2', skillName: '보컬2', skillLevel: 'INTERMEDIATE', isPrimary: true },
        ],
      },
    ],
  ],
  [
    'team-3', // 리듬 세션 편성
    [
      {
        teamMemberId: 'tm-3-1',
        bandMemberId: 'member-5',
        user: { userId: 'user-5', nickname: '이준호', profileImageUrl: null },
        teamRole: 'LEADER',
        joinedAt: '2026-05-03T12:00:00Z',
        skills: [
          { skillTypeId: 'drum-1', skillName: '드럼', skillLevel: 'ADVANCED', isPrimary: true },
        ],
      },
      {
        teamMemberId: 'tm-3-2',
        bandMemberId: 'member-6',
        user: { userId: 'user-6', nickname: '김루나', profileImageUrl: null },
        teamRole: 'MEMBER',
        joinedAt: '2026-05-03T12:30:00Z',
        skills: [
          { skillTypeId: 'bass-1', skillName: '베이스', skillLevel: 'ADVANCED', isPrimary: true },
        ],
      },
      {
        teamMemberId: 'tm-3-3',
        bandMemberId: 'member-7',
        user: { userId: 'user-7', nickname: '정지우', profileImageUrl: null },
        teamRole: 'MEMBER',
        joinedAt: '2026-05-03T13:00:00Z',
        skills: [
          { skillTypeId: 'keyboard-1', skillName: '건반', skillLevel: 'ADVANCED', isPrimary: true },
        ],
      },
    ],
  ],
]);

const getTeamMembers = (teamId: string): StoreMember[] => {
  if (!teamMemberStore.has(teamId)) {
    teamMemberStore.set(teamId, []);
  }
  return teamMemberStore.get(teamId) ?? [];
};
// ────────────────────────────────────────────────────────────────────

export const teamHandlers = [
  // GET /bands/:bandId/teams
  http.get(`${API_URL}/bands/:bandId/teams`, ({ params }) => {
    const { bandId } = params as { bandId: string };
    const items = bandTeamsStore.map((t) => ({
      ...t,
      memberCount: getTeamMembers(t.teamId).length,
    }));

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

  // POST /bands/:bandId/teams
  http.post(`${API_URL}/bands/:bandId/teams`, async ({ request, params }) => {
    const { bandId } = params as { bandId: string };
    const body = (await request.json()) as { name: string; description?: string };
    const newTeamId = `team-${Date.now()}`;
    const leaderBandMember = BAND_MEMBERS[0];
    const newTeam: StoreBandTeam = {
      teamId: newTeamId,
      name: body.name,
      description: body.description ?? null,
      status: 'ACTIVE',
      teamCoverUrl: null,
      memberCount: 1,
      teamLeader: { userId: leaderBandMember.userId, nickname: leaderBandMember.nickname },
      createdAt: new Date().toISOString(),
    };
    bandTeamsStore.unshift(newTeam);
    teamMemberStore.set(newTeamId, [
      {
        teamMemberId: `tm-${newTeamId}-leader`,
        bandMemberId: leaderBandMember.bandMemberId,
        user: {
          userId: leaderBandMember.userId,
          nickname: leaderBandMember.nickname,
          profileImageUrl: leaderBandMember.avatarUrl,
        },
        teamRole: 'LEADER',
        joinedAt: new Date().toISOString(),
        skills: leaderBandMember.skills,
      },
    ]);

    return HttpResponse.json({
      success: true,
      message: '팀 생성 성공',
      data: {
        team: {
          teamId: newTeamId,
          bandId,
          name: newTeam.name,
          description: newTeam.description,
          status: newTeam.status,
          teamCoverUrl: null,
          teamLeaderId: leaderBandMember.userId,
          createdAt: newTeam.createdAt,
          updatedAt: newTeam.createdAt,
        },
      },
    }, { status: 201 });
  }),

  // GET /teams/:teamId
  http.get(`${API_URL}/teams/:teamId`, ({ params }) => {
    const { teamId } = params as { teamId: string };
    const matchedTeam = bandTeamsStore.find((t) => t.teamId === teamId);
    const members = getTeamMembers(teamId);

    return HttpResponse.json({
      success: true,
      data: {
        teamId,
        bandId: 'band-1',
        name: matchedTeam?.name ?? '팀',
        description: matchedTeam?.description ?? null,
        status: matchedTeam?.status ?? 'ACTIVE',
        teamCoverUrl: null,
        teamLeader: matchedTeam?.teamLeader ?? (members[0] ? { userId: members[0].user.userId, nickname: members[0].user.nickname } : null),
        memberCount: members.length,
        createdAt: matchedTeam?.createdAt ?? '2026-05-01T12:00:00Z',
        updatedAt: '2026-05-01T12:00:00Z',
      },
    });
  }),

  // DELETE /teams/:teamId
  http.delete(`${API_URL}/teams/:teamId`, ({ params }) => {
    const { teamId } = params as { teamId: string };
    bandTeamsStore = bandTeamsStore.filter((t) => t.teamId !== teamId);
    teamMemberStore.delete(teamId);
    return HttpResponse.json({
      success: true,
      data: { teamId, deleted: true },
    });
  }),

  // GET /teams/:teamId/members
  http.get(`${API_URL}/teams/:teamId/members`, ({ params }) => {
    const { teamId } = params as { teamId: string };
    const items = getTeamMembers(teamId);
    return HttpResponse.json({
      success: true,
      data: {
        items,
        meta: { count: items.length, take: 20, cursor: null, next: null },
      },
    });
  }),

  // POST /teams/:teamId/members
  http.post(`${API_URL}/teams/:teamId/members`, async ({ params, request }) => {
    const { teamId } = params as { teamId: string };
    const body = (await request.json()) as { bandMemberId: string };
    const matchedBandMember = BAND_MEMBERS.find(
      (m) => m.bandMemberId === body.bandMemberId,
    );

    const newMember: StoreMember = {
      teamMemberId: `tm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      bandMemberId: body.bandMemberId,
      user: {
        userId: matchedBandMember?.userId ?? `u-${body.bandMemberId}`,
        nickname: matchedBandMember?.nickname ?? `멤버(${body.bandMemberId.slice(-4)})`,
        profileImageUrl: matchedBandMember?.avatarUrl ?? null,
      },
      teamRole: 'MEMBER',
      joinedAt: new Date().toISOString(),
      skills: matchedBandMember?.skills ?? [],
    };
    getTeamMembers(teamId).push(newMember);
    return HttpResponse.json({ success: true, data: newMember });
  }),

  // DELETE /teams/:teamId/members/:teamMemberId
  http.delete(`${API_URL}/teams/:teamId/members/:teamMemberId`, ({ params }) => {
    const { teamId, teamMemberId } = params as { teamId: string; teamMemberId: string };
    const store = getTeamMembers(teamId);
    const idx = store.findIndex((m) => m.teamMemberId === teamMemberId);
    if (idx !== -1) store.splice(idx, 1);
    return HttpResponse.json({
      success: true,
      data: { teamMemberId, removed: true },
    });
  }),
];

