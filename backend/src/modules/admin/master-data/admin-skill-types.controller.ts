import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse, createSuccessResponse } from 'src/common/api-response';

import { CurrentAdmin } from '../core/decorator/current-admin.decorator';
import { AdminRolesGuard } from '../core/guard/admin-roles.guard';
import { AdminAccessTokenGuard } from '../core/guard/admin-token.guard';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { CreateMasterDataDto, UpdateMasterDataDto } from './dto/master-data.dto';
import type { AdminSkillTypeItem } from './types/admin-master-data.type';
import { AdminSkillTypesService } from './admin-skill-types.service';

@ApiTags('어드민 - 마스터 데이터')
@ApiBearerAuth('admin-access-token')
@UseGuards(AdminAccessTokenGuard, AdminRolesGuard)
@Controller('admin/skill-types')
export class AdminSkillTypesController {
  constructor(private readonly adminSkillTypesService: AdminSkillTypesService) {}

  @Get()
  @ApiOperation({ summary: '세션 목록 조회 (사용 횟수 포함)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getSkillTypes(): Promise<ApiSuccessResponse<{ skillTypes: AdminSkillTypeItem[] }>> {
    const result = await this.adminSkillTypesService.getSkillTypes();
    return createSuccessResponse('세션 목록 조회 완료', result);
  }

  @Post()
  @ApiOperation({ summary: '세션 추가' })
  @ApiResponse({ status: 201, description: '추가 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 409, description: '같은 이름의 세션이 있음' })
  async createSkillType(@CurrentAdmin() admin: AdminPrincipal, @Body() dto: CreateMasterDataDto): Promise<ApiSuccessResponse<AdminSkillTypeItem>> {
    const result = await this.adminSkillTypesService.createSkillType(admin, dto);
    return createSuccessResponse('세션 추가 완료', result);
  }

  @Patch(':skillTypeId')
  @ApiOperation({ summary: '세션 이름·순서 수정' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '세션 없음' })
  @ApiResponse({ status: 409, description: '같은 이름의 세션이 있음' })
  async updateSkillType(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('skillTypeId', ParseUUIDPipe) skillTypeId: string,
    @Body() dto: UpdateMasterDataDto,
  ): Promise<ApiSuccessResponse<AdminSkillTypeItem>> {
    const result = await this.adminSkillTypesService.updateSkillType(admin, skillTypeId, dto);
    return createSuccessResponse('세션 수정 완료', result);
  }

  @Delete(':skillTypeId')
  @ApiOperation({ summary: '세션 삭제 (사용 중이면 불가)' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '세션 없음' })
  @ApiResponse({ status: 409, description: '유저·곡·팀·일정이 사용 중인 세션' })
  async deleteSkillType(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('skillTypeId', ParseUUIDPipe) skillTypeId: string,
  ): Promise<ApiSuccessResponse<{ skillTypeId: string }>> {
    const result = await this.adminSkillTypesService.deleteSkillType(admin, skillTypeId);
    return createSuccessResponse('세션 삭제 완료', result);
  }
}
