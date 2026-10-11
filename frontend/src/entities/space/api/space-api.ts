import { z } from 'zod';
import { apiGet, apiPatch, apiPost } from '@/shared/api';
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
  /** 공간 멤버의 bandMemberId 목록. 수정 폼의 참여자 초기값으로 쓴다. */
  memberBandMemberIds: string[];
}

// 상세 응답 `{ space, members[], songCount, scheduleCount }`에서 화면에 필요한 값만 추린다.
const spaceDetailResultSchema = z.object({
  space: bandSpaceSchema,
  members: z.array(z.object({ bandMemberId: z.string() })).default([]),
  songCount: z.number().int().nonnegative().default(0),
});

/**
 * 공간 상세를 조회해 헤더용 요약(이름/설명 + 멤버 수/곡 수)과 멤버 목록을 반환한다.
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
    memberBandMemberIds: parsed.members.map((member) => member.bandMemberId),
  };
};

export interface CreateSpaceRequest {
  name: string;
  description?: string;
  spaceType?: SpaceType;
  status?: SpaceStatus;
  startDate?: string;
  endDate?: string;
  /** 공간 참여 멤버의 bandMemberId 목록. 생성자는 백엔드가 LEADER로 넣는다. */
  bandMemberIds?: string[];
}

export const createSpace = async (
  bandId: string,
  data: CreateSpaceRequest,
): Promise<Space> => {
  const created = await apiPost<unknown>(`/bands/${bandId}/bandspaces`, data);
  return bandSpaceSchema.parse(created);
};

/**
 * 수정(PATCH /bandspaces/:id). 보낸 필드만 바뀐다.
 * bandMemberIds는 전체 교체다 — 빠진 멤버는 공간에서 나가고, LEADER만 백엔드가 남긴다.
 */
export type UpdateSpaceRequest = Partial<CreateSpaceRequest>;

export const updateSpace = async (
  spaceId: string,
  data: UpdateSpaceRequest,
): Promise<Space> => {
  const updated = await apiPatch<unknown>(`/bandspaces/${spaceId}`, data);
  return bandSpaceSchema.parse(updated);
};
