import { apiPatch } from '@/shared/api';

export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type UpdateProfileRequest = {
  profile?: {
    nickname?: string;
    selfDescription?: string;
    profileMusicUrl?: string | null;
    avatarUrl?: string | null;
  };
  personalInfo?: {
    email?: string;
  };
  skills?: Array<{
    skillTypeId: string;
    level: SkillLevel;
    isPrimary: boolean;
  }>;
  favoriteGenres?: string[];
};

export type UpdateProfileResponse = {
  updated: {
    profile?: boolean;
    personalInfo?: boolean;
    skills?: boolean;
    favoriteGenres?: boolean;
  };
};

export interface LegacyUpdateProfileRequest {
  bio?: string;
  preferredGenres?: string[];
  profileMusicUrl?: string | null;
  skills?: string[];
}

/**
 * 로그인한 사용자의 프로필, 개인정보, 스킬, 선호 장르를 한 번에 수정한다.
 */
export const updateMyProfile = (
  data: UpdateProfileRequest,
): Promise<UpdateProfileResponse> =>
  apiPatch<UpdateProfileResponse>('/me/profile', data);
