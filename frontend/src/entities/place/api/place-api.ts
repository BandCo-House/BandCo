import { z } from 'zod';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api';
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
  address?: string;
  detailAddress?: string;
  /** 좌표는 지도 검색으로 고른 위치일 때만, address와 함께 보낸다. */
  latitude?: number;
  longitude?: number;
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

/**
 * 장소 수정 요청. 안 보낸 필드는 그대로 두고, null을 보낸 필드는 지운다.
 * 주소를 바꾸면서 좌표를 안 보내면 서버가 이전 좌표를 비운다.
 */
export interface UpdatePlaceRequest {
  name?: string;
  address?: string | null;
  detailAddress?: string | null;
  latitude?: number;
  longitude?: number;
  imageUrl?: string | null;
}

/** 연습 장소 수정(PATCH /places/:placeId). */
export const updatePlace = async (
  placeId: string,
  data: UpdatePlaceRequest,
): Promise<Place> => {
  const updated = await apiPatch<unknown>(`/places/${placeId}`, data);
  return placeSchema.parse(updated);
};

/**
 * 연습 장소 삭제(DELETE /places/:placeId). 소프트 삭제라 이 장소를 쓰던 일정은 그대로 남는다.
 * 밴드 리더·부리더만 가능하다.
 */
export const deletePlace = (placeId: string) =>
  apiDelete<unknown>(`/places/${placeId}`);
