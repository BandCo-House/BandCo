import { Inject, Injectable } from '@nestjs/common';

import type { SpotifySongPreview } from './types/spotify-song-preview.type';
import { SpotifyTrackClient, type SpotifyTrackReader } from './spotify-track.client';
import { parseSpotifyTrackToSongPreview } from './spotify-track.parser';

@Injectable()
export class SongsService {
  constructor(
    @Inject(SpotifyTrackClient)
    private readonly spotifyTrackReader: SpotifyTrackReader,
  ) {}

  /**
   * Spotify track을 곡 등록 미리보기 데이터로 변환한다.
   *
   * @param {string} trackId - 조회할 Spotify track ID
   * @returns {Promise<SpotifySongPreview>} 곡 등록 미리보기 데이터
   */
  async previewSpotifyTrack(trackId: string): Promise<SpotifySongPreview> {
    const spotifyTrack = await this.spotifyTrackReader.findTrack(trackId);

    return parseSpotifyTrackToSongPreview(spotifyTrack);
  }
}
