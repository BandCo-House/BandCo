import { http, HttpResponse } from 'msw';
import type { ApiSuccessResponse } from '@/shared/api';
import type { Place } from '@/entities/place/model/types';
import { API_URL } from '../config';

// 밴드 라이브러리 연습 장소 목록 mock (GET /bands/:bandId/places)
const PLACE_FIXTURES: {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
}[] = [
  { name: '신촌 연습실 A', address: '서울특별시 신촌로 94' },
  // 지도 검색으로 고른 장소(좌표 있음). 상세에서 지도가 뜨는 경로를 dev에서 볼 수 있게 한다.
  {
    name: '합정 사운드룸',
    address: '서울특별시 마포구 양화로 45',
    latitude: 37.5496,
    longitude: 126.9139,
  },
  { name: '홍대 드럼스튜디오', address: '서울특별시 마포구 와우산로 21' },
  { name: '강남 밴드연습실', address: '서울특별시 강남구 테헤란로 123' },
  { name: '이태원 자유합주실', address: '서울특별시 용산구 이태원로 200' },
];

// PATCH로 수정한 값. 목록을 매번 fixture에서 다시 만들기 때문에, 따로 들고 있지 않으면
// 수정 직후 목록 재조회에서 원래 값으로 돌아간다.
const placeOverrides = new Map<string, Partial<Place>>();

const buildBandPlaces = (bandId: string): Place[] =>
  PLACE_FIXTURES.map(
    (fixture, i): Place => ({
      placeId: `place-${i + 1}`,
      bandId,
      name: fixture.name,
      address: fixture.address,
      detailAddress: null,
      latitude: fixture.latitude ?? null,
      longitude: fixture.longitude ?? null,
      imageUrl: null,
      isActive: true,
      createdAt: '2026-05-01T00:00:00+09:00',
      updatedAt: '2026-05-01T00:00:00+09:00',
    }),
  ).map((place) => ({ ...place, ...placeOverrides.get(place.placeId) }));

export const placeHandlers = [
  http.get(`${API_URL}/bands/:bandId/places`, ({ params, request }) => {
    const { bandId } = params as { bandId: string };
    const isActive = new URL(request.url).searchParams.get('where__is_active');
    const items = buildBandPlaces(bandId).filter(
      (place) => isActive === null || String(place.isActive) === isActive,
    );

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
      address?: string;
      detailAddress?: string;
      latitude?: number;
      longitude?: number;
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
        address: body.address ?? null,
        detailAddress: body.detailAddress ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        imageUrl: body.imageUrl ?? null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  // 연습 장소 수정 mock (PATCH /places/:placeId). 안 보낸 필드는 유지, null은 지움.
  http.patch(`${API_URL}/places/:placeId`, async ({ params, request }) => {
    const { placeId } = params as { placeId: string };
    const body = (await request.json()) as Partial<Place>;
    const patch: Partial<Place> = { ...placeOverrides.get(placeId), ...body };
    // 주소가 바뀌었는데 좌표가 없으면 이전 좌표를 비운다(백엔드와 같은 규칙).
    if ('address' in body && body.latitude === undefined) {
      patch.latitude = null;
      patch.longitude = null;
    }
    placeOverrides.set(placeId, patch);

    const current = buildBandPlaces('band-1').find(
      (place) => place.placeId === placeId,
    );

    return HttpResponse.json<ApiSuccessResponse<Partial<Place>>>({
      status: 'success',
      error: null,
      message: '요청 성공',
      data: { ...current, placeId, ...patch },
    });
  }),

  // 연습 장소 삭제 mock (DELETE /places/:placeId). 소프트 삭제라 isActive만 내린다.
  http.delete(`${API_URL}/places/:placeId`, ({ params }) => {
    const { placeId } = params as { placeId: string };
    placeOverrides.set(placeId, {
      ...placeOverrides.get(placeId),
      isActive: false,
    });

    return HttpResponse.json<
      ApiSuccessResponse<{ placeId: string; bandId: string; isActive: boolean }>
    >({
      status: 'success',
      error: null,
      message: '요청 성공',
      data: { placeId, bandId: 'band-1', isActive: false },
    });
  }),
];
