import { apiGet } from '@/shared/api';
import type { Profile } from '@/entities/profile/model/types';

export const getUserProfile = (userId: string): Promise<Profile> => 
  apiGet<Profile>(`/users/${userId}/profiles`);
