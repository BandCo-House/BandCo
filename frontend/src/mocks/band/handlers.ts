import { http, HttpResponse } from 'msw';

export const bandHandlers = [
  // 밴드 목록 조회 Mock
  http.get('/bands', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: '1', name: '홍대 인디 밴드' },
        { id: '2', name: '직장인 연합 밴드' },
        { id: '3', name: '주말 잼 세션' },
      ],
    });
  }),

  // 밴드 생성 Mock
  http.post('/bands', async ({ request }) => {
    const body = (await request.json()) as { name: string };

    // 단순 딜레이 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 300));

    return HttpResponse.json({
      success: true,
      data: {
        id: `band-${Date.now()}`,
        name: body.name,
      },
    });
  }),
];
