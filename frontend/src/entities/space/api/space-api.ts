import { z } from 'zod';
import { apiGet, apiPost } from '@/shared/api';
import { bandSpaceSchema } from '../model/schema';
import type { Space, SpaceStatus, SpaceType } from '../model/types';

export interface GetSpacesParams {
  query?: string;
  onlyMine?: boolean;
  inProgressOnly?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

interface GetBandSpacesResult {
  items: unknown[];
  pagination?: unknown;
}

const bandSpaceListSchema = z.array(bandSpaceSchema);

/**
 * 밴드 스페이스 목록을 조회한다.
 * 백엔드는 `{ items, pagination }`을 돌려주므로 items만 파싱해 반환한다.
 */
export const getBandSpaces = async (
  bandId: string,
  params?: GetSpacesParams,
): Promise<Space[]> => {
  const data = await apiGet<GetBandSpacesResult>(
    `/bands/${bandId}/bandspaces`,
    { params },
  );
  return bandSpaceListSchema.parse(data.items);
};

interface GetSpaceDetailResult {
  space: unknown;
}

export const getSpace = async (spaceId: string): Promise<Space> => {
  const data = await apiGet<GetSpaceDetailResult>(`/bandspaces/${spaceId}`);
  return bandSpaceSchema.parse(data.space);
};

export interface SpaceDetailView {
  space: Space;
  memberCount: number;
  songCount: number;
}

// 상세 응답 `{ space, members[], songCount, scheduleCount }`에서 헤더에 필요한 값만 추린다.
const spaceDetailResultSchema = z.object({
  space: bandSpaceSchema,
  members: z.array(z.unknown()).default([]),
  songCount: z.number().int().nonnegative().default(0),
});

/**
 * 공간 상세를 조회해 헤더용 요약(이름/설명 + 멤버 수/곡 수)을 반환한다.
 * 멤버 수는 members 배열 길이, 곡 수는 응답의 songCount를 사용한다.
 */
export const getSpaceDetail = async (
  spaceId: string,
): Promise<SpaceDetailView> => {
  const data = await apiGet<unknown>(`/bandspaces/${spaceId}`);
  const parsed = spaceDetailResultSchema.parse(data);
  return {
    space: parsed.space,
    memberCount: parsed.members.length,
    songCount: parsed.songCount,
  };
};

export interface CreateSpaceRequest {
  name: string;
  description?: string;
  spaceType?: SpaceType;
  status?: SpaceStatus;
  startDate?: string;
  endDate?: string;
}

export const createSpace = async (
  bandId: string,
  data: CreateSpaceRequest,
): Promise<Space> => {
  const created = await apiPost<unknown>(`/bands/${bandId}/bandspaces`, data);
  return bandSpaceSchema.parse(created);
};
