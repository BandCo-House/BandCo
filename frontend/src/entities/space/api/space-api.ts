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
