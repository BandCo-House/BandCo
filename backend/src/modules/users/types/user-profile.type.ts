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
  /** 프로필 음악. 수정 요청(profile.profileMusic)과 같은 위치로 응답한다 */
  profileMusic: ProfileMusicTrack | null;
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
  skills: UserSkillDetail[];
  favoriteGenres: UserFavoriteGenreDetail[];
}
