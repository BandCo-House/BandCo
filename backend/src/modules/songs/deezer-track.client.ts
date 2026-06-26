import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';

import type { DeezerTrackApiResponse, DeezerTrackSearchApiResponse } from './types/deezer-track-api-response.type';

export interface DeezerTrackSearcher {
  searchTracks(query: string): Promise<DeezerTrackApiResponse[]>;
}

export interface DeezerTrackReader {
  findTrack(trackId: string): Promise<DeezerTrackApiResponse>;
}

const DEEZER_TRACK_SEARCH_API_URL = 'https://api.deezer.com/search/track';
const DEEZER_TRACK_API_URL = 'https://api.deezer.com/track';

@Injectable()
export class DeezerTrackClient implements DeezerTrackSearcher, DeezerTrackReader {
  /**
   * Deezer 검색 결과를 최대 10개까지 조회한다.
   *
   * @param {string} query - 곡명과 아티스트명을 포함한 검색어
   * @returns {Promise<DeezerTrackApiResponse[]>} Deezer track 응답 목록
   */
  async searchTracks(query: string): Promise<DeezerTrackApiResponse[]> {
    const searchUrl = new URL(DEEZER_TRACK_SEARCH_API_URL);
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('limit', '10');

    const response = await fetch(searchUrl);

    if (!response.ok) {
      throw new BadGatewayException('Deezer track 검색에 실패했습니다.');
    }

    const searchResult = (await response.json()) as DeezerTrackSearchApiResponse;

    return searchResult.data;
  }

  /**
   * Deezer track ID로 단일 트랙을 조회한다.
   * 존재하지 않는 ID는 Deezer가 200과 함께 error 본문을 주므로 별도로 NotFound 처리한다.
   *
   * @param {string} trackId - Deezer track ID
   * @returns {Promise<DeezerTrackApiResponse>} Deezer track 응답
   */
  async findTrack(trackId: string): Promise<DeezerTrackApiResponse> {
    const response = await fetch(`${DEEZER_TRACK_API_URL}/${trackId}`);

    if (!response.ok) {
      throw new BadGatewayException('Deezer track 조회에 실패했습니다.');
    }

    const track = (await response.json()) as DeezerTrackApiResponse & { error?: unknown };

    if (track.error !== undefined) {
      throw new NotFoundException('요청한 트랙을 찾을 수 없습니다.');
    }

    return track;
  }
}
