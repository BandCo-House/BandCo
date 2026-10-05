import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse, createSuccessResponse } from 'src/common/api-response';

import { CurrentAdmin } from '../core/decorator/current-admin.decorator';
import { AdminPaginationQueryDto } from '../core/dto/admin-pagination-query.dto';
import { AdminRolesGuard } from '../core/guard/admin-roles.guard';
import { AdminAccessTokenGuard } from '../core/guard/admin-token.guard';
import type { AdminPaginatedResult } from '../core/types/admin-paginated.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { CreateAdminAnnouncementDto, UpdateAdminAnnouncementDto } from './dto/admin-announcement.dto';
import type { AdminAnnouncement } from './types/admin-announcement.type';
import { AdminAnnouncementsService } from './admin-announcements.service';

@ApiTags('어드민 - 공지')
@ApiBearerAuth('admin-access-token')
@UseGuards(AdminAccessTokenGuard, AdminRolesGuard)
@Controller('admin/announcements')
export class AdminAnnouncementsController {
  constructor(private readonly adminAnnouncementsService: AdminAnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: '공지 목록 조회 (최신 생성순)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: '잘못된 페이지 값' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getAnnouncements(@Query() query: AdminPaginationQueryDto): Promise<ApiSuccessResponse<AdminPaginatedResult<AdminAnnouncement>>> {
    const result = await this.adminAnnouncementsService.getAnnouncements({ page: query.page, size: query.size });
    return createSuccessResponse('공지 목록 조회 완료', result);
  }

  @Post()
  @ApiOperation({ summary: '공지 생성' })
  @ApiResponse({ status: 201, description: '생성 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패 또는 시작 시각이 종료 시각 이후' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async createAnnouncement(
    @CurrentAdmin() admin: AdminPrincipal,
    @Body() dto: CreateAdminAnnouncementDto,
  ): Promise<ApiSuccessResponse<AdminAnnouncement>> {
    const result = await this.adminAnnouncementsService.createAnnouncement(admin, dto);
    return createSuccessResponse('공지 생성 완료', result);
  }

  @Patch(':announcementId')
  @ApiOperation({ summary: '공지 수정' })
  @ApiParam({ name: 'announcementId', description: '공지 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패 또는 시작 시각이 종료 시각 이후' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '공지 없음' })
  async updateAnnouncement(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('announcementId', ParseUUIDPipe) announcementId: string,
    @Body() dto: UpdateAdminAnnouncementDto,
  ): Promise<ApiSuccessResponse<AdminAnnouncement>> {
    const result = await this.adminAnnouncementsService.updateAnnouncement(admin, announcementId, dto);
    return createSuccessResponse('공지 수정 완료', result);
  }

  @Delete(':announcementId')
  @ApiOperation({ summary: '공지 삭제' })
  @ApiParam({ name: 'announcementId', description: '공지 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 400, description: 'announcementId가 UUID 형식이 아님' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '공지 없음' })
  async deleteAnnouncement(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('announcementId', ParseUUIDPipe) announcementId: string,
  ): Promise<ApiSuccessResponse<{ announcementId: string }>> {
    const result = await this.adminAnnouncementsService.deleteAnnouncement(admin, announcementId);
    return createSuccessResponse('공지 삭제 완료', result);
  }
}
