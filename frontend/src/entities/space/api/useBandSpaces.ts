import { useQuery } from '@tanstack/react-query';
import { getBandSpaces, type GetSpacesParams } from './space-api';

export const spaceKeys = {
  all: ['spaces'] as const,
  list: (bandId: string, params: GetSpacesParams) =>
    [...spaceKeys.all, 'list', bandId, params] as const,
};

export const useBandSpaces = (bandId: string, params: GetSpacesParams = {}) =>
  useQuery({
    queryKey: spaceKeys.list(bandId, params),
    queryFn: () => getBandSpaces(bandId, params),
    enabled: !!bandId,
  });
