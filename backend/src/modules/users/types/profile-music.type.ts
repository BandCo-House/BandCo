/** JSONB trackData 컬럼에 저장되는 프로필 음악 트랙 데이터 */
export interface ProfileMusicTrack {
  externalTrackId: string;
  sourceType: 'DEEZER';
  title: string;
  artistName: string;
  albumName: string;
  albumImageUrl: string | null;
  durationMs: number;
  previewUrl: string | null;
  sourceUrl: string;
}

/** #69 DELETE /users/:userId/profile-music 응답 */
export interface DeleteProfileMusicResult {
  userId: string;
  deletedAt: string;
}
