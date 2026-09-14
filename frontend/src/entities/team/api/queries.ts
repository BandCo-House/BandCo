import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTeam,
  getBandTeams,
  getTeamDetail,
  getTeamMembers,
  replaceTeamMembers,
  type CreateTeamRequest,
  type GetBandTeamsParams,
  type ReplaceTeamMemberInput,
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
 * 팀 명단 일괄 교체 훅 (PUT /teams/:teamId/members)
 *
 * 추가·제거·세션 변경을 한 요청으로 보낸다. 단건 API 셋을 Promise.all로 함께
 * 던지면 DELETE만 성공하고 POST가 실패했을 때 사람이 사라진 채로 남는다.
 */
export const useReplaceTeamMembers = (teamId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (members: ReplaceTeamMemberInput[]) =>
      replaceTeamMembers(teamId, members),
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
