import { http, HttpResponse } from 'msw';
import type { ApiSuccessResponse } from '@/shared/api';
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

// skill/handlers.ts의 skillTypeId ↔ 이름. 팀 편성 세션명을 붙이는 데 쓴다.
const SESSION_SKILL_NAMES: Record<string, string> = {
  'guitar-1': '일렉기타',
  'acoustic-1': '통기타',
  'bass-1': '베이스',
  'drum-1': '드럼',
  'percussion-1': '퍼커션',
  'keyboard-1': '키보드',
  'vocal-1': '보컬',
};

// ── 인메모리 팀 멤버 스토어 ──────────────────────────────────────────
type StoreMember = {
  teamMemberId: string;
  bandMemberId: string;
  user: { userId: string; nickname: string; profileImageUrl: string | null };
  teamRole: string;
  joinedAt: string;
  /** 이 팀에서 맡은 세션(팀 편성). 아래 skills(개인 보유)와 다른 값이다. */
  skillType: { skillTypeId: string; name: string } | null;
  skills: {
    skillTypeId: string;
    skillName: string;
    skillLevel: string;
    isPrimary: boolean;
  }[];
};

const teamMemberStore = new Map<string, StoreMember[]>([
  [
    'team-1', // 듀얼 기타 편성
    [
      {
        teamMemberId: 'tm-1-1',
        skillType: { skillTypeId: 'vocal-1', name: '보컬' },
        bandMemberId: 'member-1',
        user: { userId: 'user-1', nickname: '김민준', profileImageUrl: null },
        teamRole: 'LEADER',
        joinedAt: '2026-05-01T12:00:00Z',
        skills: [
          {
            skillTypeId: 'vocal-1',
            skillName: '보컬',
            skillLevel: 'ADVANCED',
            isPrimary: true,
          },
          {
            skillTypeId: 'guitar-1',
            skillName: '기타',
            skillLevel: 'INTERMEDIATE',
            isPrimary: false,
          },
        ],
      },
      {
        teamMemberId: 'tm-1-2',
        skillType: { skillTypeId: 'guitar-1', name: '일렉기타' },
        bandMemberId: 'member-2',
        user: { userId: 'user-2', nickname: '박민준', profileImageUrl: null },
        teamRole: 'MEMBER',
        joinedAt: '2026-05-01T12:30:00Z',
        skills: [
          {
            skillTypeId: 'guitar-2',
            skillName: '기타2',
            skillLevel: 'ADVANCED',
            isPrimary: true,
          },
        ],
      },
    ],
  ],
  [
    'team-2', // 듀얼 보컬 편성
    [
      {
        teamMemberId: 'tm-2-1',
        skillType: { skillTypeId: 'vocal-1', name: '보컬' },
        bandMemberId: 'member-3',
        user: { userId: 'user-3', nickname: '박지은', profileImageUrl: null },
        teamRole: 'LEADER',
        joinedAt: '2026-05-02T12:00:00Z',
        skills: [
          {
            skillTypeId: 'vocal-1',
            skillName: '보컬',
            skillLevel: 'ADVANCED',
            isPrimary: true,
          },
        ],
      },
      {
        teamMemberId: 'tm-2-2',
        skillType: { skillTypeId: 'guitar-1', name: '일렉기타' },
        bandMemberId: 'member-4',
        user: { userId: 'user-4', nickname: '이서연', profileImageUrl: null },
        teamRole: 'MEMBER',
        joinedAt: '2026-05-02T13:00:00Z',
        skills: [
          {
            skillTypeId: 'vocal-2',
            skillName: '보컬2',
            skillLevel: 'INTERMEDIATE',
            isPrimary: true,
          },
        ],
      },
    ],
  ],
  [
    'team-3', // 리듬 세션 편성
    [
      {
        teamMemberId: 'tm-3-1',
        skillType: { skillTypeId: 'bass-1', name: '베이스' },
        bandMemberId: 'member-5',
        user: { userId: 'user-5', nickname: '이준호', profileImageUrl: null },
        teamRole: 'LEADER',
        joinedAt: '2026-05-03T12:00:00Z',
        skills: [
          {
            skillTypeId: 'drum-1',
            skillName: '드럼',
            skillLevel: 'ADVANCED',
            isPrimary: true,
          },
        ],
      },
      {
        teamMemberId: 'tm-3-2',
        skillType: { skillTypeId: 'drum-1', name: '드럼' },
        bandMemberId: 'member-6',
        user: { userId: 'user-6', nickname: '김루나', profileImageUrl: null },
        teamRole: 'MEMBER',
        joinedAt: '2026-05-03T12:30:00Z',
        skills: [
          {
            skillTypeId: 'bass-1',
            skillName: '베이스',
            skillLevel: 'ADVANCED',
            isPrimary: true,
          },
        ],
      },
      {
        teamMemberId: 'tm-3-3',
        skillType: { skillTypeId: 'vocal-1', name: '보컬' },
        bandMemberId: 'member-1',
        user: { userId: 'user-1', nickname: '김민수', profileImageUrl: null },
        teamRole: 'MEMBER',
        joinedAt: '2026-05-03T13:00:00Z',
        skills: [
          {
            skillTypeId: 'keyboard-1',
            skillName: '건반',
            skillLevel: 'ADVANCED',
            isPrimary: true,
          },
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
      ApiSuccessResponse<{
        bandId: string;
        items: BandTeamListItem[];
        meta: unknown;
      }>
    >({
      status: 'success',
      error: null,
      message: '요청 성공',
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
    const body = (await request.json()) as {
      name: string;
      description?: string;
    };
    const newTeamId = `team-${Date.now()}`;
    const leaderBandMember = BAND_MEMBERS[0];
    const newTeam: StoreBandTeam = {
      teamId: newTeamId,
      name: body.name,
      description: body.description ?? null,
      status: 'ACTIVE',
      teamCoverUrl: null,
      memberCount: 1,
      teamLeader: {
        userId: leaderBandMember.userId,
        nickname: leaderBandMember.nickname,
      },
      createdAt: new Date().toISOString(),
    };
    bandTeamsStore.unshift(newTeam);
    teamMemberStore.set(newTeamId, [
      {
        teamMemberId: `tm-${newTeamId}-leader`,
        skillType: null,
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

    return HttpResponse.json(
      {
        status: 'success',
        error: null,
        message: '팀 생성 성공',
        // 백엔드 CreateTeamResult 형태(감싸지 않은 평면 객체)
        data: {
          teamId: newTeamId,
          bandId,
          name: newTeam.name,
          description: newTeam.description,
          status: newTeam.status,
          teamLeaderUserId: leaderBandMember.userId,
          teamCoverUrl: null,
          createdAt: newTeam.createdAt,
        },
      },
      { status: 201 },
    );
  }),

  // GET /teams/:teamId
  http.get(`${API_URL}/teams/:teamId`, ({ params }) => {
    const { teamId } = params as { teamId: string };
    const matchedTeam = bandTeamsStore.find((t) => t.teamId === teamId);
    const members = getTeamMembers(teamId);

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '요청 성공',
      data: {
        teamId,
        bandId: 'band-1',
        name: matchedTeam?.name ?? '팀',
        description: matchedTeam?.description ?? null,
        status: matchedTeam?.status ?? 'ACTIVE',
        teamCoverUrl: null,
        teamLeader:
          matchedTeam?.teamLeader ??
          (members[0]
            ? {
                userId: members[0].user.userId,
                nickname: members[0].user.nickname,
              }
            : null),
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
      status: 'success',
      error: null,
      message: '요청 성공',
      data: { teamId, deleted: true },
    });
  }),

  // GET /teams/:teamId/members
  http.get(`${API_URL}/teams/:teamId/members`, ({ params }) => {
    const { teamId } = params as { teamId: string };
    const items = getTeamMembers(teamId);
    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '요청 성공',
      data: {
        teamId,
        items,
        meta: { count: items.length, take: 20, cursor: null, next: null },
      },
    });
  }),

  // POST /teams/:teamId/members
  http.patch(
    `${API_URL}/teams/:teamId/members/:teamMemberId`,
    async ({ params, request }) => {
      const { teamId, teamMemberId } = params as {
        teamId: string;
        teamMemberId: string;
      };
      const body = (await request.json()) as { skillTypeId?: string | null };
      const store = getTeamMembers(teamId);
      const member = store.find((m) => m.teamMemberId === teamMemberId);

      if (!member) {
        return HttpResponse.json(
          {
            status: 'fail',
            error: { code: 'NOT_FOUND', details: { statusCode: 404 } },
            message: '해당 팀에서 대상 멤버를 찾을 수 없습니다.',
            data: {},
          },
          { status: 404 },
        );
      }

      member.skillType = body.skillTypeId
        ? {
            skillTypeId: body.skillTypeId,
            name: SESSION_SKILL_NAMES[body.skillTypeId] ?? '세션',
          }
        : null;

      return HttpResponse.json({
        status: 'success',
        error: null,
        message: '팀 멤버 세션 변경 성공',
        data: {
          teamMemberId: member.teamMemberId,
          teamId,
          bandMemberId: member.bandMemberId,
          user: member.user,
          teamRole: member.teamRole,
          joinedAt: member.joinedAt,
          skillType: member.skillType,
        },
      });
    },
  ),

  // PUT /teams/:teamId/members — 명단 일괄 교체
  http.put(`${API_URL}/teams/:teamId/members`, async ({ params, request }) => {
    const { teamId } = params as { teamId: string };
    const body = (await request.json()) as {
      members: {
        teamMemberId?: string;
        bandMemberId: string;
        skillTypeId?: string | null;
      }[];
    };

    const store = getTeamMembers(teamId);
    const byId = new Map(store.map((member) => [member.teamMemberId, member]));

    // 백엔드와 같은 규칙으로 접는다. 사람도 세션도 그대로면 행을 유지하고,
    // 세션만 바뀌면 joinedAt·teamRole을 옮겨 다시 만든다.
    const next: StoreMember[] = body.members.map((input) => {
      const origin = input.teamMemberId
        ? byId.get(input.teamMemberId)
        : undefined;
      const skillTypeId = input.skillTypeId ?? null;
      const matchedBandMember = BAND_MEMBERS.find(
        (m) => m.bandMemberId === input.bandMemberId,
      );
      const isSameRow = origin?.bandMemberId === input.bandMemberId;
      const skillType = skillTypeId
        ? {
            skillTypeId,
            name:
              SESSION_SKILL_NAMES[skillTypeId] ??
              matchedBandMember?.skills[0]?.skillName ??
              '세션',
          }
        : null;

      if (origin && isSameRow) {
        const keepsRow =
          (origin.skillType?.skillTypeId ?? null) === skillTypeId;
        return {
          ...origin,
          // 세션이 바뀌면 백엔드가 행을 다시 만들어 teamMemberId가 새로 발급된다.
          teamMemberId: keepsRow
            ? origin.teamMemberId
            : `tm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          skillType,
        };
      }

      return {
        teamMemberId: `tm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        bandMemberId: input.bandMemberId,
        user: {
          userId: matchedBandMember?.userId ?? `u-${input.bandMemberId}`,
          nickname:
            matchedBandMember?.nickname ??
            `멤버(${input.bandMemberId.slice(-4)})`,
          profileImageUrl: matchedBandMember?.avatarUrl ?? null,
        },
        teamRole: 'MEMBER',
        joinedAt: new Date().toISOString(),
        skillType,
        skills: matchedBandMember?.skills ?? [],
      };
    });

    store.splice(0, store.length, ...next);

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '팀 명단 교체 성공',
      data: { teamId, members: next },
    });
  }),

  http.post(`${API_URL}/teams/:teamId/members`, async ({ params, request }) => {
    const { teamId } = params as { teamId: string };
    const body = (await request.json()) as {
      bandMemberId: string;
      skillTypeId?: string;
    };
    const matchedBandMember = BAND_MEMBERS.find(
      (m) => m.bandMemberId === body.bandMemberId,
    );

    const newMember: StoreMember = {
      teamMemberId: `tm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      bandMemberId: body.bandMemberId,
      user: {
        userId: matchedBandMember?.userId ?? `u-${body.bandMemberId}`,
        nickname:
          matchedBandMember?.nickname ?? `멤버(${body.bandMemberId.slice(-4)})`,
        profileImageUrl: matchedBandMember?.avatarUrl ?? null,
      },
      teamRole: 'MEMBER',
      joinedAt: new Date().toISOString(),
      skillType: body.skillTypeId
        ? {
            skillTypeId: body.skillTypeId,
            name:
              SESSION_SKILL_NAMES[body.skillTypeId] ??
              matchedBandMember?.skills[0]?.skillName ??
              '세션',
          }
        : null,
      skills: matchedBandMember?.skills ?? [],
    };
    getTeamMembers(teamId).push(newMember);
    // 백엔드 AddTeamMemberResult 형태(skills 없음)
    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '팀 멤버 추가 성공',
      data: {
        teamMemberId: newMember.teamMemberId,
        teamId,
        bandMemberId: newMember.bandMemberId,
        user: newMember.user,
        teamRole: newMember.teamRole,
        joinedAt: newMember.joinedAt,
      },
    });
  }),

  // DELETE /teams/:teamId/members/:teamMemberId
  http.delete(
    `${API_URL}/teams/:teamId/members/:teamMemberId`,
    ({ params }) => {
      const { teamId, teamMemberId } = params as {
        teamId: string;
        teamMemberId: string;
      };
      const store = getTeamMembers(teamId);
      const idx = store.findIndex((m) => m.teamMemberId === teamMemberId);
      if (idx !== -1) store.splice(idx, 1);
      return HttpResponse.json({
        status: 'success',
        error: null,
        message: '요청 성공',
        data: { teamMemberId, removed: true },
      });
    },
  ),
];
