import { apiClient, apiDelete, apiGet, apiPatch } from '@/shared/api';
import type {
  Band,
  BandDetail,
  BandInviteLink,
  UpdateBandRequest,
} from '../model/types';
import {
  bandDetailSchema,
  bandInviteLinkSchema,
  bandListResponseSchema,
} from '../model/schema';

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

/** 밴드 정보 수정(PATCH /bands/:bandId). 밴드 설정의 기본 설정 탭이 쓴다. */
export const updateBand = async (
  bandId: string,
  body: UpdateBandRequest,
): Promise<BandDetail> => {
  const { band } = await apiPatch<{ band: unknown }>(`/bands/${bandId}`, body);
  return bandDetailSchema.parse(band);
};

/** 밴드 나가기(DELETE /bands/:bandId/me). 밴드 마스터는 403이 돌아온다. */
export const leaveBand = (bandId: string): Promise<unknown> =>
  apiDelete(`/bands/${bandId}/me`);

/**
 * 밴드 영구 초대 링크 조회.
 * TODO: 백엔드 API 신설 전까지 MSW mock이 응답한다(band_invite_link 테이블만 존재).
 */
export const getBandInviteLink = async (
  bandId: string,
): Promise<BandInviteLink> => {
  const data = await apiGet<unknown>(`/bands/${bandId}/invite-link`);
  return bandInviteLinkSchema.parse(data);
};
