import { useQuery } from '@tanstack/react-query';
import { getBandSongs, type GetBandSongsParams } from './song-api';

export const songKeys = {
  all: ['songs'] as const,
  list: (bandId: string, params: GetBandSongsParams) =>
    [...songKeys.all, 'list', bandId, params] as const,
};

export const useBandSongs = (
  bandId: string,
  params: GetBandSongsParams = {},
  options: { enabled?: boolean } = {},
) =>
  useQuery({
    queryKey: songKeys.list(bandId, params),
    queryFn: () => getBandSongs(bandId, params),
    enabled: (options.enabled ?? true) && !!bandId,
  });
