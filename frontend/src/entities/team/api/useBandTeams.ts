import { useQuery } from '@tanstack/react-query';
import { getBandTeams, type GetBandTeamsParams } from './team-api';

export const teamKeys = {
  all: ['teams'] as const,
  list: (bandId: string, params: GetBandTeamsParams) =>
    [...teamKeys.all, 'list', bandId, params] as const,
};

export const useBandTeams = (bandId: string, params: GetBandTeamsParams = {}) =>
  useQuery({
    queryKey: teamKeys.list(bandId, params),
    queryFn: () => getBandTeams(bandId, params),
    enabled: !!bandId,
  });
