import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { Space } from '@/entities/space/model/types';
import { API_URL } from '../config';

// 필터 검증용 mock 7건: 내 공연(isMine) 3건, 진행 중(status ACTIVE) 5건.
// 둘 다 포함(1·2), 진행 중만(3·5·6), 내 공연만(4), 둘 다 아님(7)을 섞었다.
const spaces: Space[] = [
  {
    spaceId: 'space-1',
    bandId: 'band-1',
    name: '정기 모임',
    description: '정기 연주 및 신곡 연습',
    spaceType: 'PRACTICE',
    status: 'ACTIVE',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    memberCount: 6,
    songCount: 4,
    isMine: true,
    myMembership: { isMember: true, role: 'MEMBER' },
  },
  {
    spaceId: 'space-2',
    bandId: 'band-1',
    name: '봄꽃 축제',
    description: '봄꽃 축제 연주곡 연습',
    spaceType: 'PERFORMANCE',
    status: 'ACTIVE',
    startDate: '2026-05-20',
    endDate: '2026-06-09',
    memberCount: 4,
    songCount: 3,
    isMine: true,
    myMembership: { isMember: true, role: 'LEADER' },
  },
  {
    spaceId: 'space-3',
    bandId: 'band-1',
    name: '신입생 환영 공연',
    description: '정기 연주 및 신곡 연습',
    spaceType: 'PERFORMANCE',
    status: 'ACTIVE',
    startDate: '2026-06-01',
    endDate: '2026-06-17',
    memberCount: 5,
    songCount: 2,
    isMine: false,
    myMembership: { isMember: false, role: 'MEMBER' },
  },
  {
    spaceId: 'space-4',
    bandId: 'band-1',
    name: '2026 하계 공연 무대',
    description: '여름 축제 공연 준비',
    spaceType: 'PERFORMANCE',
    status: 'INACTIVE',
    startDate: '2026-07-01',
    endDate: '2026-09-05',
    memberCount: 7,
    songCount: 5,
    isMine: true,
    myMembership: { isMember: true, role: 'MEMBER' },
  },
  {
    spaceId: 'space-5',
    bandId: 'band-1',
    name: '가을 정기 공연',
    description: '가을 정기 공연 준비',
    spaceType: 'PERFORMANCE',
    status: 'ACTIVE',
    startDate: '2026-08-01',
    endDate: '2026-10-05',
    memberCount: 6,
    songCount: 4,
    isMine: false,
    myMembership: { isMember: false, role: 'MEMBER' },
  },
  {
    spaceId: 'space-6',
    bandId: 'band-1',
    name: '겨울 갈라쇼',
    description: '연말 갈라쇼 무대 준비',
    spaceType: 'PERFORMANCE',
    status: 'ACTIVE',
    startDate: '2026-09-01',
    endDate: '2026-11-04',
    memberCount: 8,
    songCount: 6,
    isMine: false,
    myMembership: { isMember: false, role: 'MEMBER' },
  },
  {
    spaceId: 'space-7',
    bandId: 'band-1',
    name: '졸업 공연',
    description: '졸업생 헌정 무대',
    spaceType: 'PERFORMANCE',
    status: 'INACTIVE',
    startDate: '2026-10-01',
    endDate: '2026-12-24',
    memberCount: 5,
    songCount: 3,
    isMine: false,
    myMembership: { isMember: false, role: 'MEMBER' },
  },
];

const parseBoolean = (value: string | null): boolean => value === 'true';

export const spaceHandlers = [
  http.get(`${API_URL}/bands/:bandId/bandspaces`, ({ request }) => {
    const url = new URL(request.url);
    const onlyMine = parseBoolean(url.searchParams.get('onlyMine'));
    const inProgressOnly = parseBoolean(url.searchParams.get('inProgressOnly'));

    const items = spaces.filter(
      (space) =>
        (!onlyMine || space.isMine) &&
        (!inProgressOnly || space.status === 'ACTIVE'),
    );

    return HttpResponse.json<
      ApiResponse<{ items: Space[]; pagination: unknown }>
    >({
      success: true,
      data: {
        items,
        pagination: {
          page: 1,
          size: 20,
          totalCount: items.length,
          hasNext: false,
        },
      },
    });
  }),
  http.get(`${API_URL}/bandspaces/:spaceId`, ({ params }) => {
    const space =
      spaces.find((item) => item.spaceId === params.spaceId) ?? spaces[0];

    // 상세 응답은 멤버 배열과 곡 수를 함께 반환한다(헤더 요약용).
    const members = Array.from({ length: space.memberCount ?? 0 }, (_, i) => ({
      bandMemberId: `member-${i + 1}`,
      nickname: `멤버${i + 1}`,
      role: 'MEMBER',
      status: 'ACTIVE',
      joinedAt: '2026-01-01',
    }));

    return HttpResponse.json<
      ApiResponse<{
        space: Space;
        members: unknown[];
        songCount: number;
        scheduleCount: number;
      }>
    >({
      success: true,
      data: {
        space,
        members,
        songCount: space.songCount ?? 0,
        scheduleCount: 0,
      },
    });
  }),
  http.post(`${API_URL}/bands/:bandId/bandspaces`, async ({ request }) => {
    const body = (await request.json()) as Partial<Space>;

    return HttpResponse.json<ApiResponse<Space>>({
      success: true,
      data: { ...spaces[0], ...body, spaceId: 'space-created' },
    });
  }),
];
