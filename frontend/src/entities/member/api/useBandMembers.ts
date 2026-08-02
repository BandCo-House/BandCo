import { useQuery } from '@tanstack/react-query';
import { getBandMembers, type GetBandMembersParams } from './member-api';

export const memberKeys = {
  all: ['band-members'] as const,
  list: (bandId: string, params: GetBandMembersParams) =>
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
