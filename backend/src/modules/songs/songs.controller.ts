import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { AuthUser } from '../users/repositoreis/user.repository';

import { CreateSongBodyDto } from './dto/create-song.dto';
import { GetBandSongsQueryDto } from './dto/get-band-songs-query.dto';
import { UpdateSongBodyDto } from './dto/update-song.dto';
import type { CreateSongResult } from './types/create-song-result.type';
import type { DeleteSongResult } from './types/delete-song-result.type';
import type { GetBandSongsResult } from './types/song-list.type';
import type { UpdateSongResult } from './types/update-song-result.type';
import { SongsService } from './songs.service';

interface AuthenticatedRequest {
  user: AuthUser;
}

@ApiTags('곡')
@Controller()
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Post('bands/:bandId/songs')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '곡 생성' })
  @ApiParam({ name: 'bandId', description: '밴드 ID (UUID)', type: String })
  @ApiResponse({ status: 201, description: '곡 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '밴드를 찾을 수 없음' })
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
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '밴드 곡 목록 조회' })
  @ApiParam({ name: 'bandId', description: '밴드 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '곡 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '밴드를 찾을 수 없음' })
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
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '곡 수정' })
  @ApiParam({ name: 'songId', description: '곡 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '곡 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '곡을 찾을 수 없음' })
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
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '곡 삭제' })
  @ApiParam({ name: 'songId', description: '곡 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '곡 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '곡을 찾을 수 없음' })
  async deleteSong(@Req() req: AuthenticatedRequest, @Param('songId') songId: string): Promise<ApiSuccessResponse<DeleteSongResult>> {
    const result = await this.songsService.deleteSong(req.user.id, songId);

    return createSuccessResponse('곡이 삭제되었습니다.', result);
  }
}
