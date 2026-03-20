import type { Band } from '@/entities/band/model/types';
import { http, HttpResponse } from 'msw';
import { API_URL } from '../config';

export const bandHandlers = [
  // 밴드 목록 조회 Mock
  http.get(`${API_URL}/bands`, () => {
    const bands: Band[] = [
      {
        id: 'a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1',
        name: '합주하자',
        description: '주 1회 합주',
        visibility: true,
        inviteCode: '7KQ2M9',
        bmId: 'b6d0f0b1-7c7d-4e23-9c7b-0c0d9f6a2a21',
        myRole: 'BM',
        joinedAt: '2026-03-01T12:10:00.000+09:00',
        createdAt: '2026-03-01T12:00:00.000+09:00',
        memberCount: 10,
      },
      {
        id: 'e2f9a1c1-3d4b-4f2a-9d1f-8a7c1f2d3e4a',
        name: '락스타',
        description: null,
        visibility: true,
        inviteCode: 'P1Z8Q0',
        bmId: '9aa1bb22-0000-0000-0000-000000000000',
        myRole: 'MEMBER',
        joinedAt: '2026-02-20T18:30:00.000+09:00',
        createdAt: '2026-02-10T09:00:00.000+09:00',
        memberCount: 4,
      },
    ];

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '내 밴드 목록 조회 성공',
      data: {
        totalCount: bands.length,
        bands,
      },
    });
  }),

  // 밴드 생성 Mock
  http.post(`${API_URL}/bands`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      description: string | null;
      visibility: boolean;
    };

    // 단순 딜레이 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 300));

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '밴드 생성 성공',
      data: {
        band: {
          id: `band-${Date.now()}`,
          name: body.name,
          description: body.description,
          visibility: body.visibility,
          inviteCode: 'NEW123',
          bmId: 'bm-new',
          createdAt: '2026-03-03T18:20:10.123+09:00',
          updatedAt: '2026-03-03T18:20:10.123+09:00',
        },
      },
    });
  }),
];
