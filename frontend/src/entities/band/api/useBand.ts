import { useQuery } from '@tanstack/react-query';
import { getBand } from './band-api';

export const bandDetailKeys = {
  all: ['band', 'detail'] as const,
  detail: (bandId: string) => [...bandDetailKeys.all, bandId] as const,
};

export const useBand = (bandId: string) =>
  useQuery({
    queryKey: bandDetailKeys.detail(bandId),
    queryFn: () => getBand(bandId),
    enabled: !!bandId,
  });
