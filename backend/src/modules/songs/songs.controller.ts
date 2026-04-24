import { Controller, Get, Param } from '@nestjs/common';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import type { SpotifySongPreview } from './types/spotify-song-preview.type';
import { SongsService } from './songs.service';

@Controller()
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Get('songs/spotify/tracks/:trackId')
  async getSpotifyTrackPreview(@Param('trackId') trackId: string): Promise<ApiSuccessResponse<SpotifySongPreview>> {
    const songPreview = await this.songsService.previewSpotifyTrack(trackId);

    return createSuccessResponse('Spotify 곡 미리보기 조회 성공', songPreview);
  }
}
