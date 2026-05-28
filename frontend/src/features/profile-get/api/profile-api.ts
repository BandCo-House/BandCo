import { apiGet } from '@/shared/api';
import type { Profile } from '@/entities/profile/model/types';

export const getUserProfile = (userId: string): Promise<Profile> => {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    return Promise.reject(new Error('userId is required'));
  }
  return apiGet<Profile>(`/users/${encodeURIComponent(normalizedUserId)}/profiles`);
};
