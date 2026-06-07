import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { Place } from '@/entities/place/model/types';
import { API_URL } from '../config';

// 밴드 라이브러리 연습 장소 목록 mock (GET /bands/:bandId/places)
const bandPlaces: Place[] = Array.from({ length: 5 }, (_, i) => ({
  placeId: `place-${i + 1}`,
  bandId: 'band-1',
  name: '연습실 A',
  address: '서울특별시 신촌로 94',
  detailAddress: null,
  imageUrl: null,
  isActive: true,
  createdAt: '2026-05-01T00:00:00+09:00',
  updatedAt: '2026-05-01T00:00:00+09:00',
}));

export const placeHandlers = [
  http.get(`${API_URL}/bands/:bandId/places`, () => {
    return HttpResponse.json<
      ApiResponse<{ bandId: string; items: Place[]; meta: unknown }>
    >({
      success: true,
      data: {
        bandId: 'band-1',
        items: bandPlaces,
        meta: { count: bandPlaces.length, take: 20, cursor: null, next: null },
      },
    });
  }),
];
