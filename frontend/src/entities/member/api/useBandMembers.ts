import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getBandMembers,
  kickBandMember,
  updateBandMemberRole,
  type GetBandMembersParams,
} from './member-api';
import type { BandMemberRole } from '../model/types';

export const memberKeys = {
  all: ['band-members'] as const,
  list: (bandId: string, params: GetBandMembersParams = {}) =>
    [...memberKeys.all, 'list', bandId, params] as const,
};

export const useBandMembers = (
  bandId: string,
  params: GetBandMembersParams = {},
  options: { enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: memberKeys.list(bandId, params),
    queryFn: () => getBandMembers(bandId, params),
    enabled: (options.enabled ?? true) && !!bandId,
  });

export const useUpdateBandMemberRole = (bandId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: BandMemberRole }) =>
      updateBandMemberRole(bandId, userId, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
};

export const useKickBandMember = (bandId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => kickBandMember(bandId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
};
