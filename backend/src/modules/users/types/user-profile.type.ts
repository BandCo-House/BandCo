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
  /** 고유 ID(@handle). 아직 정하지 않았으면 null. 누구나 볼 수 있다 */
  handle: string | null;
  /** 고유 ID 다음 변경 가능 시각. 본인 조회이면서 쿨다운 중일 때만 값이 있고, 그 외에는 null */
  handleChangeableAt: string | null;
  selfDescription: string | null;
  avatarUrl: string | null;
  /** 프로필 음악. 수정 요청(profile.profileMusic)과 같은 위치로 응답한다 */
  profileMusic: ProfileMusicTrack | null;
}

export type { ProfileMusicTrack };

/**
 * Repository가 돌려주는 프로필 원본. 쿨다운 기준 시각을 그대로 담는다.
 * 응답용 handleChangeableAt은 조회자가 본인인지에 따라 달라져 Service가 계산한다.
 */
export type UserProfileRecordDetail = Omit<UserProfileDetail, 'handleChangeableAt'> & {
  handleChangedAt: Date | null;
};

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

/** Repository가 돌려주는 프로필 조회 원본 */
export type UserProfileRecord = Omit<GetUserProfileResult, 'profile'> & {
  profile: UserProfileRecordDetail | null;
};
