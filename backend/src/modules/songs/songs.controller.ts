import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { User } from '../../generated/prisma';

import { CreateSongBodyDto } from './dto/create-song.dto';
import { GetBandSongsQueryDto } from './dto/get-band-songs-query.dto';
import { SearchDeezerTrackPreviewsQueryDto } from './dto/search-deezer-track-previews-query.dto';
import { UpdateSongBodyDto } from './dto/update-song.dto';
import type { CreateSongResult } from './types/create-song-result.type';
import type { DeleteSongResult } from './types/delete-song-result.type';
import type { GetBandSongsResult } from './types/song-list.type';
import type { SongPreview } from './types/song-preview.type';
import type { UpdateSongResult } from './types/update-song-result.type';
import { SongsService } from './songs.service';

interface AuthenticatedRequest {
  user: User;
}

@Controller()
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Post('bands/:bandId/songs')
  @UseGuards(AccessTokenGuard)
  async createSong(
    @Req() req: AuthenticatedRequest,
    @Param('bandId') bandId: string,
    @Body() body: CreateSongBodyDto,
  ): Promise<ApiSuccessResponse<CreateSongResult>> {
    const result = await this.songsService.createSong(req.user.id, bandId, body);

    return createSuccessResponse('곡 생성 성공', result);
  }

  @Get('bands/:bandId/songs')
  @UseGuards(AccessTokenGuard)
  async getBandSongs(
    @Req() req: AuthenticatedRequest,
    @Param('bandId') bandId: string,
    @Query() query: GetBandSongsQueryDto,
  ): Promise<ApiSuccessResponse<GetBandSongsResult>> {
    const result = await this.songsService.getBandSongs(req.user.id, bandId, query);

    return createSuccessResponse('곡 목록 조회 성공', result);
  }

  @Patch('songs/:songId')
  @UseGuards(AccessTokenGuard)
  async updateSong(
    @Req() req: AuthenticatedRequest,
    @Param('songId') songId: string,
    @Body() body: UpdateSongBodyDto,
  ): Promise<ApiSuccessResponse<UpdateSongResult>> {
    const result = await this.songsService.updateSong(req.user.id, songId, body);

    return createSuccessResponse('곡이 수정되었습니다.', result);
  }

  @Delete('songs/:songId')
  @UseGuards(AccessTokenGuard)
  async deleteSong(@Req() req: AuthenticatedRequest, @Param('songId') songId: string): Promise<ApiSuccessResponse<DeleteSongResult>> {
    const result = await this.songsService.deleteSong(req.user.id, songId);

    return createSuccessResponse('곡이 삭제되었습니다.', result);
  }

  @Get('songs/spotify/tracks/:trackId')
  async getSpotifyTrackPreview(@Param('trackId') trackId: string): Promise<ApiSuccessResponse<SongPreview>> {
    const songPreview = await this.songsService.previewSpotifyTrack(trackId);

    return createSuccessResponse('Spotify 곡 미리보기 조회 성공', songPreview);
  }

  @Get('songs/deezer/tracks/search')
  async searchDeezerTrackPreviews(@Query() query: SearchDeezerTrackPreviewsQueryDto): Promise<ApiSuccessResponse<SongPreview[]>> {
    const songPreviews = await this.songsService.searchDeezerTrackPreviews(query.query);

    return createSuccessResponse('Deezer 곡 미리보기 목록 조회 성공', songPreviews);
  }
}
