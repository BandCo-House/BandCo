import { http, HttpResponse } from 'msw';
import type { ApiSuccessResponse } from '@/shared/api';
import type { Place } from '@/entities/place/model/types';
import { API_URL } from '../config';

// 밴드 라이브러리 연습 장소 목록 mock (GET /bands/:bandId/places)
const PLACE_FIXTURES = [
  { name: '신촌 연습실 A', address: '서울특별시 신촌로 94' },
  { name: '합정 사운드룸', address: '서울특별시 마포구 양화로 45' },
  { name: '홍대 드럼스튜디오', address: '서울특별시 마포구 와우산로 21' },
  { name: '강남 밴드연습실', address: '서울특별시 강남구 테헤란로 123' },
  { name: '이태원 자유합주실', address: '서울특별시 용산구 이태원로 200' },
];

const buildBandPlaces = (bandId: string): Place[] =>
  PLACE_FIXTURES.map((fixture, i) => ({
    placeId: `place-${i + 1}`,
    bandId,
    name: fixture.name,
    address: fixture.address,
    detailAddress: null,
    imageUrl: null,
    isActive: true,
    createdAt: '2026-05-01T00:00:00+09:00',
    updatedAt: '2026-05-01T00:00:00+09:00',
  }));

export const placeHandlers = [
  http.get(`${API_URL}/bands/:bandId/places`, ({ params }) => {
    const { bandId } = params as { bandId: string };
    const items = buildBandPlaces(bandId);

    return HttpResponse.json<
      ApiSuccessResponse<{ bandId: string; items: Place[]; meta: unknown }>
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

  // 연습 장소 생성 mock (POST /bands/:bandId/places)
  http.post(`${API_URL}/bands/:bandId/places`, async ({ params, request }) => {
    const { bandId } = params as { bandId: string };
    const body = (await request.json()) as {
      name: string;
      address: string;
      detailAddress?: string;
      imageUrl?: string;
    };

    return HttpResponse.json<ApiSuccessResponse<Place>>({
      status: 'success',
      error: null,
      message: '요청 성공',
      data: {
        placeId: `place-created-${Date.now()}`,
        bandId,
        name: body.name,
        address: body.address,
        detailAddress: body.detailAddress ?? null,
        imageUrl: body.imageUrl ?? null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),
];
