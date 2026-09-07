import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addTeamMember,
  createTeam,
  getBandTeams,
  getTeamDetail,
  getTeamMembers,
  removeTeamMember,
  type CreateTeamRequest,
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

/**
 * 팀 멤버 추가 훅 (POST /teams/:teamId/members)
 */
export const useAddTeamMember = (teamId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bandMemberId: string) => addTeamMember(teamId, bandMemberId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: teamKeys.members(teamId),
      });
    },
  });
};

/**
 * 팀 멤버 제거 훅 (DELETE /teams/:teamId/members/:teamMemberId)
 */
export const useRemoveTeamMember = (teamId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teamMemberId: string) =>
      removeTeamMember(teamId, teamMemberId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: teamKeys.members(teamId),
      });
    },
  });
};

/**
 * 팀 생성 훅 (POST /bands/:bandId/teams)
 */
export const useCreateTeam = (bandId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTeamRequest) => createTeam(bandId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamKeys.list(bandId) });
    },
  });
};
