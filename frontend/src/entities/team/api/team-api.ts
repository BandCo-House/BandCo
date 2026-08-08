import { z } from 'zod';
import { apiGet, apiPost, apiDelete } from '@/shared/api';
import {
  bandTeamListItemSchema,
  teamDetailSchema,
  teamMemberSchema,
} from '../model/schema';
import type {
  BandTeamListItem,
  TeamDetail,
  TeamMember,
} from '../model/types';

export interface GetBandTeamsParams {
  order__created_at?: 'asc' | 'desc';
  order__id?: 'asc' | 'desc';
  take?: number;
  cursor__created_at?: string;
  cursor__id?: string;
}

interface GetBandTeamsResult {
  bandId?: string;
  items: unknown[];
  meta?: unknown;
}

const teamListSchema = z.array(bandTeamListItemSchema);
const teamMemberListSchema = z.array(teamMemberSchema);

/**
 * 밴드 팀 목록을 조회한다.
 * 백엔드는 `{ bandId, items, meta }`를 돌려주므로 items만 파싱해 반환한다.
 */
export const getBandTeams = async (
  bandId: string,
  params?: GetBandTeamsParams,
): Promise<BandTeamListItem[]> => {
  const data = await apiGet<GetBandTeamsResult>(`/bands/${bandId}/teams`, {
    params,
  });
  return teamListSchema.parse(data.items);
};

/**
 * 팀 상세 정보를 조회한다. (GET /teams/:teamId)
 */
export const getTeamDetail = async (teamId: string): Promise<TeamDetail> => {
  const data = await apiGet<{ data: unknown }>(`/teams/${teamId}`);
  return teamDetailSchema.parse(data.data ?? data);
};

/**
 * 팀을 삭제한다. (DELETE /teams/:teamId)
 */
export const deleteTeam = async (
  teamId: string,
): Promise<{ teamId: string; deleted: boolean }> => {
  const data = await apiDelete<{ data: { teamId: string; deleted: boolean } }>(
    `/teams/${teamId}`,
  );
  return data.data ?? data;
};

/**
 * 팀 멤버 목록을 조회한다. (GET /teams/:teamId/members)
 */
export const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
  const data = await apiGet<{ data: { items: unknown[] } }>(
    `/teams/${teamId}/members`,
  );
  const items = data.data?.items ?? (data as unknown as { items: unknown[] }).items ?? [];
  return teamMemberListSchema.parse(items);
};

/**
 * 팀 멤버를 추가한다. (POST /teams/:teamId/members)
 */
export const addTeamMember = async (
  teamId: string,
  bandMemberId: string,
): Promise<TeamMember> => {
  const data = await apiPost<{ data: unknown }>(`/teams/${teamId}/members`, {
    bandMemberId,
  });
  return teamMemberSchema.parse(data.data ?? data);
};

/**
 * 팀 멤버를 제거한다. (DELETE /teams/:teamId/members/:teamMemberId)
 */
export const removeTeamMember = async (
  teamId: string,
  teamMemberId: string,
): Promise<{ teamMemberId: string; removed: boolean }> => {
  const data = await apiDelete<{
    data: { teamMemberId: string; removed: boolean };
  }>(`/teams/${teamId}/members/${teamMemberId}`);
  return data.data ?? data;
};

