import { useQuery } from '@tanstack/react-query';
import { getMyBands } from './band-api';

export const bandKeys = {
  all: ['bands'] as const,
  my: () => [...bandKeys.all, 'me'] as const,
};

export const useMyBands = (enabled: boolean = true) => {
  return useQuery({
    queryKey: bandKeys.my(),
    queryFn: getMyBands,
    enabled,
  });
};
