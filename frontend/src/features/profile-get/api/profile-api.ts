import { apiGet } from '@/shared/api';
import type { Profile } from '@/entities/profile/model/types';

export const getMyProfile = (): Promise<Profile> => apiGet<Profile>('/me/profile');
