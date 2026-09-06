import { z } from 'zod';
import { apiGet, apiPost, apiDelete } from '@/shared/api';
import {
  bandTeamListItemSchema,
  teamDetailSchema,
  teamMemberSchema,
} from '../model/schema';
import type { BandTeamListItem, TeamDetail, TeamMember } from '../model/types';
import { MEMBER_PICKER_TAKE } from '@/shared/lib/member-picker';

export interface GetBandTeamsParams {
  order__created_at?: 'asc' | 'desc';
  order__id?: 'asc' | 'desc';
  take?: number;
  cursor__created_at?: string;
  cursor__id?: string;
}

/** 밴드 팀 목록(GET /bands/:bandId/teams) 결과. items만 쓰므로 나머지는 검증하지 않는다. */
const bandTeamsResultSchema = z.object({
  items: z.array(bandTeamListItemSchema),
});

/** 팀 멤버 목록(GET /teams/:teamId/members) 결과. */
const teamMembersResultSchema = z.object({
  items: z.array(teamMemberSchema),
});

/** 팀 생성(POST /bands/:bandId/teams) 결과 중 화면이 쓰는 필드. */
const createdTeamSchema = z.object({
  teamId: z.string(),
  name: z.string(),
});

/**
 * 밴드 팀 목록을 조회한다.
 * 백엔드는 `{ bandId, items, meta }`를 돌려주므로 items만 반환한다.
 */
export const getBandTeams = async (
  bandId: string,
  params?: GetBandTeamsParams,
): Promise<BandTeamListItem[]> => {
  const data = await apiGet<unknown>(`/bands/${bandId}/teams`, { params });
  return bandTeamsResultSchema.parse(data).items;
};

/**
 * 팀 상세 정보를 조회한다. (GET /teams/:teamId)
 */
export const getTeamDetail = async (teamId: string): Promise<TeamDetail> => {
  const data = await apiGet<unknown>(`/teams/${teamId}`);
  return teamDetailSchema.parse(data);
};

/**
 * 팀을 삭제한다. (DELETE /teams/:teamId)
 */
export const deleteTeam = (
  teamId: string,
): Promise<{ teamId: string; deleted: boolean }> =>
  apiDelete<{ teamId: string; deleted: boolean }>(`/teams/${teamId}`);

/**
 * 팀 멤버 목록을 조회한다. (GET /teams/:teamId/members)
 * 백엔드는 `{ teamId, items, meta }`를 돌려주므로 items만 반환한다.
 * take를 안 주면 백엔드 기본값이 20이라, 그보다 큰 팀은 조용히 잘린다.
 */
export const getTeamMembers = async (
  teamId: string,
  take = MEMBER_PICKER_TAKE,
): Promise<TeamMember[]> => {
  const data = await apiGet<unknown>(`/teams/${teamId}/members`, {
    params: { take },
  });
  return teamMembersResultSchema.parse(data).items;
};

/**
 * 팀 멤버를 추가한다. (POST /teams/:teamId/members)
 * skillTypeId를 주면 그 세션으로 배정한다. 같은 멤버를 다른 세션으로 여러 번 넣을 수 있다.
 */
export const addTeamMember = async (
  teamId: string,
  bandMemberId: string,
  skillTypeId?: string,
): Promise<TeamMember> => {
  const data = await apiPost<unknown>(`/teams/${teamId}/members`, {
    bandMemberId,
    ...(skillTypeId ? { skillTypeId } : {}),
  });
  return teamMemberSchema.parse(data);
};

/**
 * 팀 멤버를 제거한다. (DELETE /teams/:teamId/members/:teamMemberId)
 */
export const removeTeamMember = (
  teamId: string,
  teamMemberId: string,
): Promise<{ teamMemberId: string; removed: boolean }> =>
  apiDelete<{ teamMemberId: string; removed: boolean }>(
    `/teams/${teamId}/members/${teamMemberId}`,
  );

export interface CreateTeamRequest {
  name: string;
  description?: string;
  teamCoverUrl?: string;
}

/**
 * 팀을 생성한다. (POST /bands/:bandId/teams)
 * 백엔드는 감싸지 않은 `CreateTeamResult`를 돌려준다.
 */
export const createTeam = async (
  bandId: string,
  body: CreateTeamRequest,
): Promise<{ teamId: string; name: string }> => {
  const data = await apiPost<unknown>(`/bands/${bandId}/teams`, body);
  return createdTeamSchema.parse(data);
};
