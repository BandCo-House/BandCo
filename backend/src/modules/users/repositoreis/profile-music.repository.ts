import type { Prisma } from 'src/generated/prisma';

import type { DeleteProfileMusicResult, ProfileMusicTrack } from '../types/profile-music.type';

export const PROFILE_MUSIC_REPOSITORY = Symbol('PROFILE_MUSIC_REPOSITORY');

export interface ProfileMusicRepository {
  /**
   * userId로 ProfileMusic 레코드를 조회한다.
   * 존재하지 않으면 null을 반환한다.
   */
  findByUserId(userId: string, tx?: Prisma.TransactionClient): Promise<ProfileMusicTrack | null>;

  /**
   * ProfileMusic을 upsert한다.
   * userId 기준으로 이미 존재하면 trackData를 업데이트하고, 없으면 신규 생성한다.
   */
  upsertByUserId(userId: string, trackData: ProfileMusicTrack, tx?: Prisma.TransactionClient): Promise<ProfileMusicTrack>;

  /**
   * userId로 ProfileMusic을 삭제하고 삭제 결과를 반환한다.
   * 레코드가 없으면 null을 반환한다.
   */
  deleteByUserId(userId: string, tx?: Prisma.TransactionClient): Promise<DeleteProfileMusicResult | null>;
}
