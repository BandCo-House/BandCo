import { apiGet } from '@/shared/api';
import type { Profile } from '@/entities/profile/model/types';
import { profileSchema } from '@/entities/profile/model/schema';

export const getUserProfile = (userId: string): Promise<Profile> => {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    return Promise.reject(new Error('userId is required'));
  }
  return apiGet<unknown>(
    `/users/${encodeURIComponent(normalizedUserId)}/profiles`,
  ).then((result) => profileSchema.parse(result));
};
