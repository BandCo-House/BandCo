import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse, createSuccessResponse } from 'src/common/api-response';

import { CurrentAdmin } from '../core/decorator/current-admin.decorator';
import { AdminRolesGuard } from '../core/guard/admin-roles.guard';
import { AdminAccessTokenGuard } from '../core/guard/admin-token.guard';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { CreateMasterDataDto, UpdateMasterDataDto } from './dto/master-data.dto';
import type { AdminGenreItem } from './types/admin-master-data.type';
import { AdminGenresService } from './admin-genres.service';

@ApiTags('어드민 - 마스터 데이터')
@ApiBearerAuth('admin-access-token')
@UseGuards(AdminAccessTokenGuard, AdminRolesGuard)
@Controller('admin/genres')
export class AdminGenresController {
  constructor(private readonly adminGenresService: AdminGenresService) {}

  @Get()
  @ApiOperation({ summary: '장르 목록 조회 (사용 횟수 포함)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getGenres(): Promise<ApiSuccessResponse<{ genres: AdminGenreItem[] }>> {
    const result = await this.adminGenresService.getGenres();
    return createSuccessResponse('장르 목록 조회 완료', result);
  }

  @Post()
  @ApiOperation({ summary: '장르 추가' })
  @ApiResponse({ status: 201, description: '추가 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 409, description: '같은 이름의 장르가 있음' })
  async createGenre(@CurrentAdmin() admin: AdminPrincipal, @Body() dto: CreateMasterDataDto): Promise<ApiSuccessResponse<AdminGenreItem>> {
    const result = await this.adminGenresService.createGenre(admin, dto);
    return createSuccessResponse('장르 추가 완료', result);
  }

  @Patch(':genreId')
  @ApiOperation({ summary: '장르 이름·순서 수정' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '장르 없음' })
  @ApiResponse({ status: 409, description: '같은 이름의 장르가 있음' })
  async updateGenre(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('genreId', ParseUUIDPipe) genreId: string,
    @Body() dto: UpdateMasterDataDto,
  ): Promise<ApiSuccessResponse<AdminGenreItem>> {
    const result = await this.adminGenresService.updateGenre(admin, genreId, dto);
    return createSuccessResponse('장르 수정 완료', result);
  }

  @Delete(':genreId')
  @ApiOperation({ summary: '장르 삭제 (사용 중이면 불가)' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '장르 없음' })
  @ApiResponse({ status: 409, description: '밴드·유저가 사용 중인 장르' })
  async deleteGenre(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('genreId', ParseUUIDPipe) genreId: string,
  ): Promise<ApiSuccessResponse<{ genreId: string }>> {
    const result = await this.adminGenresService.deleteGenre(admin, genreId);
    return createSuccessResponse('장르 삭제 완료', result);
  }
}
