import { useQuery } from '@tanstack/react-query';
import {
  getBandTeams,
  getTeamDetail,
  getTeamMembers,
  type GetBandTeamsParams,
} from './team-api';

/**
 * 팀 도메인 Query Key Factory
 */
export const teamKeys = {
  all: ['teams'] as const,
  list: (bandId: string, params: GetBandTeamsParams = {}) =>
    [...teamKeys.all, 'list', bandId, params] as const,
  detail: (teamId: string) => [...teamKeys.all, 'detail', teamId] as const,
  members: (teamId: string) => [...teamKeys.all, 'members', teamId] as const,
};

/**
 * 밴드 팀 목록 조회 훅 (GET /bands/:bandId/teams)
 */
export const useBandTeams = (
  bandId: string,
  params: GetBandTeamsParams = {},
  options: { enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: teamKeys.list(bandId, params),
    queryFn: () => getBandTeams(bandId, params),
    enabled: (options.enabled ?? true) && !!bandId,
  });

/**
 * 팀 상세 정보 조회 훅 (GET /teams/:teamId)
 */
export const useTeamDetail = (teamId: string) =>
  useQuery({
    queryKey: teamKeys.detail(teamId),
    queryFn: () => getTeamDetail(teamId),
    enabled: Boolean(teamId),
  });

/**
 * 팀 멤버 목록 조회 훅 (GET /teams/:teamId/members)
 */
export const useTeamMembers = (teamId: string) =>
  useQuery({
    queryKey: teamKeys.members(teamId),
    queryFn: () => getTeamMembers(teamId),
    enabled: Boolean(teamId),
  });
