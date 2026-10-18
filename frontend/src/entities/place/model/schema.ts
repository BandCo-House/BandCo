import { z } from 'zod';

/**
 * 연습 장소(Place) 스키마.
 * 목록(`GET /bands/:bandId/places`)·상세·생성·수정 응답을 모두 수용하도록
 * 엔드포인트별로 빠질 수 있는 bandId/createdAt/updatedAt은 optional로 둔다.
 */
export const placeSchema = z.object({
  placeId: z.string(),
  bandId: z.string().optional(),
  name: z.string(),
  // 이름만으로 충분한 장소("동방 1호")는 주소가 없다.
  address: z.string().nullable().default(null),
  detailAddress: z.string().nullable().default(null),
  // 지도 검색으로 고른 장소에만 있다. 지도 링크 노출 여부를 가른다.
  latitude: z.number().nullable().default(null),
  longitude: z.number().nullable().default(null),
  imageUrl: z.string().nullable().default(null),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
