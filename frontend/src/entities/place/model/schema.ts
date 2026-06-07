import { z } from 'zod';

/**
 * 연습 장소(Place) 스키마.
 * 목록(`GET /bands/:bandId/places`)과 상세(`GET /places/:placeId`)를 모두 수용하도록
 * 목록 응답에 없는 bandId/updatedAt은 optional로 둔다.
 */
export const placeSchema = z.object({
  placeId: z.string(),
  bandId: z.string().optional(),
  name: z.string(),
  address: z.string(),
  detailAddress: z.string().nullable().default(null),
  imageUrl: z.string().nullable().default(null),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
