import { useQuery } from '@tanstack/react-query';
import { getMyBands } from './band-api';

export const bandKeys = {
  all: ['bands'] as const,
  lists: () => [...bandKeys.all, 'list'] as const,
};

export const useBands = () => {
  return useQuery({
    queryKey: bandKeys.lists(),
    queryFn: getMyBands,
  });
};
