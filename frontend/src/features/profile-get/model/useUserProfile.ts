import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '../api/profile-api';

export const profileKeys = {
  all: ['user-profiles'] as const,
  detail: (userId: string) => [...profileKeys.all, 'detail', userId] as const,
};

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: () => getUserProfile(userId),
    enabled: !!userId,
  });
};
