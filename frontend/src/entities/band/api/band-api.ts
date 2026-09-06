import { apiClient, apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api';
import type {
  Band,
  BandDetail,
  BandInviteLink,
  UpdateBandRequest,
  UpdatedBand,
} from '../model/types';
import {
  bandDetailSchema,
  bandInviteLinkSchema,
  updatedBandSchema,
  bandListResponseSchema,
} from '../model/schema';

export const getBands = async (): Promise<Band[]> => {
  const response = await apiClient.get('/bands/me');
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

/**
 * 밴드 정보 수정(PATCH /bands/:bandId). 밴드 설정의 기본 설정 탭이 쓴다.
 * 응답은 상세 조회와 달리 감싸지 않은 평평한 객체다(`{ bandId, ... }`).
 */
export const updateBand = async (
  bandId: string,
  body: UpdateBandRequest,
): Promise<UpdatedBand> => {
  const data = await apiPatch<unknown>(`/bands/${bandId}`, body);
  return updatedBandSchema.parse(data);
};

/** 밴드 나가기(DELETE /bands/:bandId/me). 밴드 마스터는 403이 돌아온다. */
export const leaveBand = (bandId: string): Promise<unknown> =>
  apiDelete(`/bands/${bandId}/me`);

/**
 * 밴드 초대 링크 발급·재발급(POST). 기존 코드를 무효화하고 7일짜리 새 코드를 만든다.
 * 밴드 운영자(BM/ADMIN)만 호출할 수 있고, 원본 코드는 이 응답에서만 볼 수 있다.
 */
export const createBandInviteLink = async (
  bandId: string,
): Promise<BandInviteLink> => {
  const data = await apiPost<unknown>(`/bands/${bandId}/invite-link`);
  return bandInviteLinkSchema.parse(data);
};

/** 밴드 초대 링크 폐기(DELETE). 운영자만 호출할 수 있다. */
export const revokeBandInviteLink = (bandId: string): Promise<unknown> =>
  apiDelete(`/bands/${bandId}/invite-link`);

/** 초대 코드로 밴드에 가입한다(POST /invite-links/:code/join). */
export const joinBandByInviteCode = (code: string): Promise<unknown> =>
  apiPost(`/invite-links/${code}/join`);
