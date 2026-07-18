import { useQuery } from '@tanstack/react-query';
import { getBandPlaces, type GetBandPlacesParams } from './place-api';

export const placeKeys = {
  all: ['places'] as const,
  list: (bandId: string, params: GetBandPlacesParams) =>
    [...placeKeys.all, 'list', bandId, params] as const,
};

export const useBandPlaces = (
  bandId: string,
  params: GetBandPlacesParams = {},
  options: { enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: placeKeys.list(bandId, params),
    queryFn: () => getBandPlaces(bandId, params),
    enabled: (options.enabled ?? true) && !!bandId,
  });
