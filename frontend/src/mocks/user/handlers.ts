import { http, HttpResponse } from 'msw';
import { API_URL } from '../config';

export interface MockUserListItem {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  skills?: { skillName: string; isPrimary?: boolean }[];
  createdAt: string;
}

export const mockUsers: MockUserListItem[] = [
  {
    id: 'user-kim-001',
    nickname: '김나영',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    status: 'ACTIVE',
    skills: [{ skillName: '보컬', isPrimary: true }],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-kim-002',
    nickname: '김지훈',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    status: 'ACTIVE',
    skills: [{ skillName: '일렉기타', isPrimary: true }],
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'user-kim-003',
    nickname: '김민',
    avatarUrl: null,
    status: 'ACTIVE',
    skills: [{ skillName: '건반', isPrimary: true }],
    createdAt: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'user-park-004',
    nickname: '박서준',
    avatarUrl: null,
    status: 'ACTIVE',
    skills: [{ skillName: '드럼', isPrimary: true }],
    createdAt: '2026-01-04T00:00:00.000Z',
  },
  // auth mock의 로그인 사용자. 초대 후보에서 본인이 빠지는지 dev에서 확인하려면 목록에 있어야 한다.
  {
    id: 'user-001',
    nickname: '김민수',
    avatarUrl: null,
    status: 'ACTIVE',
    skills: [{ skillName: '보컬', isPrimary: true }],
    createdAt: '2026-01-05T00:00:00.000Z',
  },
  // 백엔드 /users는 비활성 유저도 돌려주지만 초대는 ACTIVE만 통과한다. 거르는지 확인용.
  {
    id: 'user-kim-005',
    nickname: '김도윤',
    avatarUrl: null,
    status: 'INACTIVE',
    skills: [{ skillName: '베이스', isPrimary: true }],
    createdAt: '2026-01-06T00:00:00.000Z',
  },
];

export const userHandlers = [
  http.get(`${API_URL}/users`, ({ request }) => {
    const url = new URL(request.url);
    const contain = url.searchParams.get('where__nickname__contain')?.trim();

    const filtered = contain
      ? mockUsers.filter((u) => u.nickname.includes(contain))
      : mockUsers;

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '유저 목록 조회 성공',
      data: {
        items: filtered,
        meta: {
          count: filtered.length,
          take: 20,
          cursor: null,
          next: null,
        },
      },
    });
  }),
];
