import { Inject, Injectable } from '@nestjs/common';

import type { SongPreview } from './types/song-preview.type';
import { DeezerTrackClient, type DeezerTrackSearcher } from './deezer-track.client';
import { parseDeezerTrackToSongPreview } from './deezer-track.parser';
import { SpotifyTrackClient, type SpotifyTrackReader } from './spotify-track.client';
import { parseSpotifyTrackToSongPreview } from './spotify-track.parser';

@Injectable()
export class SongsService {
  constructor(
    @Inject(SpotifyTrackClient)
    private readonly spotifyTrackReader: SpotifyTrackReader,
    @Inject(DeezerTrackClient)
    private readonly deezerTrackSearcher: DeezerTrackSearcher,
  ) {}

  /**
   * Spotify track을 곡 등록 미리보기 데이터로 변환한다.
   *
   * @param {string} trackId - 조회할 Spotify track ID
   * @returns {Promise<SongPreview>} 곡 등록 미리보기 데이터
   */
  async previewSpotifyTrack(trackId: string): Promise<SongPreview> {
    const spotifyTrack = await this.spotifyTrackReader.findTrack(trackId);

    return parseSpotifyTrackToSongPreview(spotifyTrack);
  }

  /**
   * Deezer track 검색 결과를 곡 등록 미리보기 데이터 목록으로 변환한다.
   *
   * @param {string} query - 곡명과 아티스트명을 포함한 검색어
   * @returns {Promise<SongPreview[]>} 곡 등록 미리보기 데이터 목록
   */
  async searchDeezerTrackPreviews(query: string): Promise<SongPreview[]> {
    const deezerTracks = await this.deezerTrackSearcher.searchTracks(query);

    return deezerTracks.map(deezerTrack => parseDeezerTrackToSongPreview(deezerTrack));
  }
}
