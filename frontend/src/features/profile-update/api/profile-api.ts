import { apiPatch } from '@/shared/api';
import type { Profile } from '@/entities/profile/model/types';
import { profileSchema } from '@/entities/profile/model/schema';
import type { ProfileMusic } from '@/entities/profile/model/types';

export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type UpdateProfileRequest = {
  profile?: {
    nickname?: string;
    selfDescription?: string | null;
    profileMusic?: ProfileMusic | null;
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

/**
 * 로그인한 사용자의 프로필, 개인정보, 스킬, 선호 장르를 한 번에 수정한다.
 */
export const updateUserProfile = (
  userId: string,
  data: UpdateProfileRequest | FormData,
): Promise<Profile> => {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    return Promise.reject(new Error('userId is required'));
  }
  return apiPatch<unknown>(
    `/users/${encodeURIComponent(normalizedUserId)}/profiles`,
    data,
    data instanceof FormData
      ? {
          headers: {
            'Content-Type': undefined,
          },
          transformRequest: [(requestData) => requestData],
        }
      : undefined,
  ).then((result) => profileSchema.parse(result));
};
