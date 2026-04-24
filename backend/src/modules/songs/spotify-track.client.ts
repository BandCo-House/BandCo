import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';

import type { SpotifyClientCredentialsTokenResponse } from './types/spotify-client-credentials-token-response.type';
import type { SpotifyTrackApiResponse } from './types/spotify-track-api-response.type';

export interface SpotifyTrackReader {
  findTrack(trackId: string): Promise<SpotifyTrackApiResponse>;
}

const SPOTIFY_TOKEN_API_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_TRACK_API_URL = 'https://api.spotify.com/v1/tracks';
const TOKEN_EXPIRATION_BUFFER_MS = 60_000;

@Injectable()
export class SpotifyTrackClient implements SpotifyTrackReader {
  private cachedAccessToken: string | undefined;
  private cachedAccessTokenExpiresAt = 0;

  /**
   * Spotify Web API에서 track 단건을 조회한다.
   *
   * @param {string} trackId - 조회할 Spotify track ID
   * @returns {Promise<SpotifyTrackApiResponse>} Spotify track 응답
   */
  async findTrack(trackId: string): Promise<SpotifyTrackApiResponse> {
    const spotifyAccessToken = await this.getAccessToken();

    const response = await fetch(`${SPOTIFY_TRACK_API_URL}/${trackId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${spotifyAccessToken}`,
      },
    });

    if (response.status === 404) {
      throw new NotFoundException('Spotify track을 찾을 수 없습니다.');
    }

    if (response.status === 403) {
      throw new BadGatewayException('Spotify 앱 소유자 Premium 구독이 필요합니다.');
    }

    if (!response.ok) {
      throw new BadGatewayException('Spotify track 조회에 실패했습니다.');
    }

    return (await response.json()) as SpotifyTrackApiResponse;
  }

  /**
   * Client Credentials Flow로 Spotify access token을 발급받고 만료 전까지 재사용한다.
   *
   * @returns {Promise<string>} Spotify access token
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    const cachedAccessToken = this.cachedAccessToken;
    const hasUsableCachedToken = cachedAccessToken !== undefined && now < this.cachedAccessTokenExpiresAt;

    if (hasUsableCachedToken) {
      return cachedAccessToken;
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (clientId === undefined || clientId.trim() === '') {
      throw new BadGatewayException('Spotify client ID가 설정되지 않았습니다.');
    }

    if (clientSecret === undefined || clientSecret.trim() === '') {
      throw new BadGatewayException('Spotify client secret이 설정되지 않았습니다.');
    }

    const requestBody = new URLSearchParams();
    requestBody.set('grant_type', 'client_credentials');
    requestBody.set('client_id', clientId.trim());
    requestBody.set('client_secret', clientSecret.trim());

    const response = await fetch(SPOTIFY_TOKEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });

    if (!response.ok) {
      throw new BadGatewayException('Spotify access token 발급에 실패했습니다.');
    }

    const tokenResponse = (await response.json()) as SpotifyClientCredentialsTokenResponse;
    const expiresInMs = tokenResponse.expires_in * 1000;

    this.cachedAccessToken = tokenResponse.access_token;
    this.cachedAccessTokenExpiresAt = Date.now() + expiresInMs - TOKEN_EXPIRATION_BUFFER_MS;

    return tokenResponse.access_token;
  }
}
