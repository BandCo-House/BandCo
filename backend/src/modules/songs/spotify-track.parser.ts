import type { SongPreview } from './types/song-preview.type';
import type { SpotifyTrackApiResponse } from './types/spotify-track-api-response.type';

const SPOTIFY_SOURCE_TYPE = 'SPOTIFY';

/**
 * Spotify track 응답을 곡 등록 전에 확인할 수 있는 데이터로 변환한다.
 *
 * @param {SpotifyTrackApiResponse} spotifyTrack - Spotify Web API track 응답
 * @returns {SongPreview} 곡 등록 미리보기 데이터
 */
export function parseSpotifyTrackToSongPreview(spotifyTrack: SpotifyTrackApiResponse): SongPreview {
  const artistNames = spotifyTrack.artists.map(artist => artist.name);
  const artistName = artistNames.join(', ');

  const firstAlbumImage = spotifyTrack.album.images[0];
  const albumImageUrl = firstAlbumImage?.url ?? null;

  const spotifyTrackUrl = spotifyTrack.external_urls.spotify;
  const fallbackTrackUrl = `https://open.spotify.com/track/${spotifyTrack.id}`;
  const sourceUrl = spotifyTrackUrl ?? fallbackTrackUrl;

  return {
    externalTrackId: spotifyTrack.id,
    title: spotifyTrack.name,
    artistName,
    albumName: spotifyTrack.album.name,
    albumImageUrl,
    releaseDate: spotifyTrack.album.release_date,
    durationMs: spotifyTrack.duration_ms,
    previewUrl: spotifyTrack.preview_url,
    sourceUrl,
    sourceType: SPOTIFY_SOURCE_TYPE,
  };
}
