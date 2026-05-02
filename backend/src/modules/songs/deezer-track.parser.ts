import type { DeezerTrackApiResponse } from './types/deezer-track-api-response.type';
import type { SongPreview } from './types/song-preview.type';

const DEEZER_SOURCE_TYPE = 'DEEZER';

/**
 * Deezer track 응답을 곡 등록 전에 확인할 수 있는 데이터로 변환한다.
 *
 * @param {DeezerTrackApiResponse} deezerTrack - Deezer track 응답
 * @returns {SongPreview} 곡 등록 미리보기 데이터
 */
export function parseDeezerTrackToSongPreview(deezerTrack: DeezerTrackApiResponse): SongPreview {
  const durationMs = deezerTrack.duration * 1000;
  const albumImageUrl =
    deezerTrack.album.cover_xl || deezerTrack.album.cover_big || deezerTrack.album.cover_medium || deezerTrack.album.cover || null;

  return {
    externalTrackId: String(deezerTrack.id),
    title: deezerTrack.title,
    artistName: deezerTrack.artist.name,
    albumName: deezerTrack.album.title,
    albumImageUrl,
    releaseDate: null,
    durationMs,
    previewUrl: deezerTrack.preview,
    sourceUrl: deezerTrack.link,
    sourceType: DEEZER_SOURCE_TYPE,
  };
}
