import type { SkillLevelType, UserStatus } from 'src/generated/prisma';

import type { ProfileMusicTrack } from './profile-music.type';

export interface UserProfileUserDetail {
  id: string;
  email: string | null;
  status: UserStatus;
  createdAt: string;
}

export interface UserProfileDetail {
  nickname: string;
  selfDescription: string | null;
  avatarUrl: string | null;
}

export type { ProfileMusicTrack };

export interface UserSkillDetail {
  skillTypeId: string;
  skillName: string;
  level: SkillLevelType;
  isPrimary: boolean;
}

export interface UserFavoriteGenreDetail {
  genreId: string;
  name: string;
}

export interface GetUserProfileResult {
  user: UserProfileUserDetail;
  profile: UserProfileDetail | null;
  profileMusic: ProfileMusicTrack | null;
  skills: UserSkillDetail[];
  favoriteGenres: UserFavoriteGenreDetail[];
}
