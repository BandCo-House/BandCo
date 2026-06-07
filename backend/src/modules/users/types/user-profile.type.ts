import type { SkillLevelType, UserStatus } from 'src/generated/prisma';

export interface UserProfileUserDetail {
  id: string;
  email: string | null;
  status: UserStatus;
  createdAt: string;
}

export interface UserProfileDetail {
  nickname: string;
  selfDescription: string | null;
  profileMusicUrl: string | null;
  avatarUrl: string | null;
}

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
  skills: UserSkillDetail[];
  favoriteGenres: UserFavoriteGenreDetail[];
}
