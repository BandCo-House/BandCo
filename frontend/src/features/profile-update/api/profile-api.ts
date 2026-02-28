import { apiPatch } from '@/shared/api';
import type { Profile } from '@/entities/profile/model/types';

export interface UpdateProfileRequest {
  bio?: string;
  preferredGenres?: string[];
  profileMusicUrl?: string | null;
  skills?: string[];
}

export const updateMyProfile = (
  data: UpdateProfileRequest,
): Promise<Profile> => apiPatch<Profile>('/me/profile', data);
