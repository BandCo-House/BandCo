import { BadGatewayException, Injectable } from '@nestjs/common';

import type { DeezerTrackApiResponse, DeezerTrackSearchApiResponse } from './types/deezer-track-api-response.type';

export interface DeezerTrackSearcher {
  searchTracks(query: string): Promise<DeezerTrackApiResponse[]>;
}

const DEEZER_TRACK_SEARCH_API_URL = 'https://api.deezer.com/search/track';

@Injectable()
export class DeezerTrackClient implements DeezerTrackSearcher {
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
}
