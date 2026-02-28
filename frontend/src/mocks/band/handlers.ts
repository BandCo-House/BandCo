import type { Band } from '@/entities/band/model/types';
import type { ApiResponse } from '@/shared/api';
import { http, HttpResponse } from 'msw';
import { API_URL } from '../config';

export const bandHandlers = [
  // 밴드 목록 조회 Mock
  http.get(`${API_URL}/bands`, () => {
    return HttpResponse.json<ApiResponse<Band[]>>({
      success: true,
      data: [
        { id: '1', name: '홍대 인디 밴드', memberCount: 1 },
        { id: '2', name: '직장인 연합 밴드', memberCount: 1 },
        { id: '3', name: '주말 잼 세션', memberCount: 1 },
      ],
    });
  }),

  // 밴드 생성 Mock
  http.post(`${API_URL}/bands`, async ({ request }) => {
    const body = (await request.json()) as { name: string };

    // 단순 딜레이 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 300));

    return HttpResponse.json<ApiResponse<Band>>({
      success: true,
      data: {
        id: `band-${Date.now()}`,
        name: body.name,
        memberCount: 1,
      },
    });
  }),
];
