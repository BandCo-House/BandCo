import { http, HttpResponse } from 'msw';
import type { ApiSuccessResponse } from '@/shared/api';
import type { Place } from '@/entities/place/model/types';
import { API_URL } from '../config';

// 밴드 라이브러리 연습 장소 목록 mock (GET /bands/:bandId/places)
// 실제 서울 주요 합주실/연습실 위치 좌표 및 상세 위치를 반영한다.
const PLACE_FIXTURES: {
  name: string;
  address: string | null;
  detailAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
}[] = [
  {
    name: '신촌 연습실 A',
    address: '서울특별시 서대문구 신촌로 94',
    detailAddress: '지하 1층 A룸',
    latitude: 37.5552,
    longitude: 126.9369,
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: '합정 사운드룸',
    address: '서울특별시 마포구 양화로 45',
    detailAddress: '지하 1층',
    latitude: 37.5496,
    longitude: 126.9139,
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: '홍대 드럼스튜디오',
    address: '서울특별시 마포구 와우산로 21',
    detailAddress: '3층 302호',
    latitude: 37.5512,
    longitude: 126.9248,
    imageUrl: null,
  },
  {
    name: '강남 밴드연습실',
    address: '서울특별시 강남구 테헤란로 123',
    detailAddress: '지하 2층 합주실',
    latitude: 37.4988,
    longitude: 127.0317,
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: '이태원 자유합주실',
    address: '서울특별시 용산구 이태원로 200',
    detailAddress: '4층',
    latitude: 37.5348,
    longitude: 126.9947,
    imageUrl: null,
  },
  // 주소/좌표가 없는 동아리방 케이스 (지도 영역 미노출 분기 테스트용)
  {
    name: '학생회관 동아리방',
    address: null,
    detailAddress: '학생회관 4층 402호',
    latitude: null,
    longitude: null,
    imageUrl: null,
  },
];

// 메모리 상에서 동적으로 추가된 장소 목록
const createdPlaces: Place[] = [];

// PATCH로 수정한 값. 목록 재조회 시 반영
const placeOverrides = new Map<string, Partial<Place>>();

const buildBandPlaces = (bandId: string): Place[] => {
  const initialPlaces = PLACE_FIXTURES.map(
    (fixture, i): Place => ({
      placeId: `place-${i + 1}`,
      bandId,
      name: fixture.name,
      address: fixture.address,
      detailAddress: fixture.detailAddress,
      latitude: fixture.latitude,
      longitude: fixture.longitude,
      imageUrl: fixture.imageUrl,
      isActive: true,
      createdAt: '2026-05-01T00:00:00+09:00',
      updatedAt: '2026-05-01T00:00:00+09:00',
    }),
  );

  return [...initialPlaces, ...createdPlaces].map((place) => ({
    ...place,
    ...placeOverrides.get(place.placeId),
  }));
};

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

    const newPlace: Place = {
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
    };

    createdPlaces.unshift(newPlace);

    return HttpResponse.json<ApiSuccessResponse<Place>>({
      status: 'success',
      error: null,
      message: '요청 성공',
      data: newPlace,
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
