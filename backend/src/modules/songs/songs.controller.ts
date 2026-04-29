import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import type { SongPreview } from './types/song-preview.type';
import { SongsService } from './songs.service';

@Controller()
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Get('songs/spotify/tracks/:trackId')
  async getSpotifyTrackPreview(@Param('trackId') trackId: string): Promise<ApiSuccessResponse<SongPreview>> {
    const songPreview = await this.songsService.previewSpotifyTrack(trackId);

    return createSuccessResponse('Spotify 곡 미리보기 조회 성공', songPreview);
  }

  @Get('songs/deezer/tracks/search')
  async searchDeezerTrackPreviews(@Query('query') query: string | undefined): Promise<ApiSuccessResponse<SongPreview[]>> {
    if (query === undefined || query.trim() === '') {
      throw new BadRequestException('query는 필수입니다.');
    }

    const songPreviews = await this.songsService.searchDeezerTrackPreviews(query.trim());

    return createSuccessResponse('Deezer 곡 미리보기 목록 조회 성공', songPreviews);
  }
}
