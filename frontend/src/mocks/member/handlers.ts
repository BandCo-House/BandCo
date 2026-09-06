import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { BandMemberListItem } from '@/entities/member/model/types';
import { API_URL } from '../config';

// 디자인(합주/회의 상세·추가)의 멤버와 일치. skillTypeId는 skill mock(/common/skills)과 맞춘다.
// 역할: BM=리더, ADMIN=부리더, 나머지 MEMBER (리더/부리더/전원선택 숏컷 확인용).
export const BAND_MEMBERS: BandMemberListItem[] = [
  {
    bandMemberId: 'member-1',
    userId: 'user-1',
    nickname: '김민수',
    avatarUrl: null,
    role: 'BM',
    joinedAt: '2026-01-02T00:00:00+09:00',
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
    bandMemberId: 'member-2',
    userId: 'user-2',
    nickname: '박지은',
    avatarUrl: null,
    role: 'ADMIN',
    joinedAt: '2026-01-05T00:00:00+09:00',
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
    bandMemberId: 'member-3',
    userId: 'user-3',
    nickname: '이준호',
    avatarUrl: null,
    role: 'MEMBER',
    joinedAt: '2026-01-08T00:00:00+09:00',
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
    bandMemberId: 'member-4',
    userId: 'user-4',
    nickname: '최유나',
    avatarUrl: null,
    role: 'MEMBER',
    joinedAt: '2026-01-11T00:00:00+09:00',
    skills: [
      {
        skillTypeId: 'keyboard-1',
        skillName: '키보드',
        skillLevel: 'INTERMEDIATE',
        isPrimary: true,
      },
    ],
  },
  {
    bandMemberId: 'member-5',
    userId: 'user-5',
    nickname: '김루나',
    avatarUrl: null,
    role: 'MEMBER',
    joinedAt: '2026-01-15T00:00:00+09:00',
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
    bandMemberId: 'member-6',
    userId: 'user-6',
    nickname: '송창섭',
    avatarUrl: null,
    role: 'MEMBER',
    joinedAt: '2026-01-20T00:00:00+09:00',
    skills: [
      {
        skillTypeId: 'guitar-1',
        skillName: '일렉기타',
        skillLevel: 'ADVANCED',
        isPrimary: true,
      },
      {
        skillTypeId: 'vocal-1',
        skillName: '보컬',
        skillLevel: 'INTERMEDIATE',
        isPrimary: false,
      },
    ],
  },
];

// 멤버별 지참사항(일정 상세 참여자 note 시드). 멤버 속성이 아니라 일정별 참여자 메모다.
export const MEMBER_GEAR: Record<string, string> = {
  'member-1': 'Fender Stratocaster',
  'member-2': 'Fender Precision Bass',
  'member-3': 'Pearl Export Series',
};

let bandMembersStore = [...BAND_MEMBERS];

export const memberHandlers = [
  // 밴드 멤버 목록 mock (GET /bands/:bandId/users)
  http.get(`${API_URL}/bands/:bandId/users`, ({ params }) => {
    const { bandId } = params as { bandId: string };
    return HttpResponse.json<
      ApiResponse<{
        bandId: string;
        members: BandMemberListItem[];
        meta: unknown;
      }>
    >({
      success: true,
      data: {
        bandId,
        members: bandMembersStore,
        meta: {
          count: bandMembersStore.length,
          take: 20,
          cursor: null,
          next: null,
        },
      },
    });
  }),

  // 밴드 멤버 권한 변경 mock (PATCH /bands/:bandId/users/:userId)
  http.patch(`${API_URL}/bands/:bandId/users/:userId`, async ({ params, request }) => {
    const { userId } = params as { userId: string };
    const body = (await request.json()) as { role: string };
    const member = bandMembersStore.find((m) => m.userId === userId);
    if (member) {
      member.role = body.role;
    }
    return HttpResponse.json({
      success: true,
      data: { userId, role: body.role },
    });
  }),

  // 밴드 멤버 강퇴 mock (DELETE /bands/:bandId/users/:userId)
  http.delete(`${API_URL}/bands/:bandId/users/:userId`, ({ params }) => {
    const { userId } = params as { userId: string };
    bandMembersStore = bandMembersStore.filter((m) => m.userId !== userId);
    return HttpResponse.json({
      success: true,
      data: { userId, removed: true },
    });
  }),
];
