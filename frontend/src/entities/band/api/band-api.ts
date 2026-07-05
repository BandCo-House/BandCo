import { apiClient, apiGet } from '@/shared/api';
import type { Band, BandDetail } from '../model/types';
import { bandDetailSchema, bandListResponseSchema } from '../model/schema';

export const getBands = async (): Promise<Band[]> => {
  const response = await apiClient.get('/bands');
  const parsed = bandListResponseSchema.parse(response.data);
  return parsed.data.items;
};

export const getMyBands = async (): Promise<Band[]> => {
  const response = await apiClient.get('/bands/me');
  const parsed = bandListResponseSchema.parse(response.data);
  return parsed.data.items;
};

/** 밴드 상세 조회(GET /bands/:bandId). 상세 헤더에 밴드명·멤버 수를 채운다. */
export const getBand = async (bandId: string): Promise<BandDetail> => {
  const { band } = await apiGet<{ band: unknown }>(`/bands/${bandId}`);
  return bandDetailSchema.parse(band);
};
