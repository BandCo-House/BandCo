import { z } from 'zod';
import { apiGet, apiPost } from '@/shared/api';
import { placeSchema } from '../model/schema';
import type { Place } from '../model/types';

export interface GetBandPlacesParams {
  order__created_at?: 'ASC' | 'DESC';
  order__id?: 'ASC' | 'DESC';
  take?: number;
  where__is_active?: boolean;
  cursor__created_at?: string;
  cursor__id?: string;
}

interface GetBandPlacesResult {
  bandId?: string;
  items: unknown[];
  meta?: unknown;
}

const placeListSchema = z.array(placeSchema);

/**
 * 밴드 연습 장소 목록을 조회한다.
 * 백엔드는 `{ bandId, items, meta }`를 돌려주므로 items만 파싱해 반환한다.
 */
export const getBandPlaces = async (
  bandId: string,
  params?: GetBandPlacesParams,
): Promise<Place[]> => {
  const data = await apiGet<GetBandPlacesResult>(`/bands/${bandId}/places`, {
    params,
  });
  return placeListSchema.parse(data.items);
};

export interface CreatePlaceRequest {
  name: string;
  address: string;
  detailAddress?: string;
  imageUrl?: string;
}

/** 밴드 연습 장소 생성(POST /bands/:bandId/places). */
export const createPlace = async (
  bandId: string,
  data: CreatePlaceRequest,
): Promise<Place> => {
  const created = await apiPost<unknown>(`/bands/${bandId}/places`, data);
  return placeSchema.parse(created);
};
