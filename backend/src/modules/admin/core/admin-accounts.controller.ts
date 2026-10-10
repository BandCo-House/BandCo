import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse, createSuccessResponse } from 'src/common/api-response';

import { AdminRoles } from './decorator/admin-roles.decorator';
import { CurrentAdmin } from './decorator/current-admin.decorator';
import { CreateAdminDto, ResetAdminPasswordDto, UpdateAdminDto } from './dto/admin-accounts.dto';
import { AdminRolesGuard } from './guard/admin-roles.guard';
import { AdminAccessTokenGuard } from './guard/admin-token.guard';
import type { AdminPrincipal, AdminProfile } from './types/admin-principal.type';
import { AdminAccountsService } from './admin-accounts.service';

@ApiTags('어드민 - 계정 관리')
@ApiBearerAuth('admin-access-token')
@UseGuards(AdminAccessTokenGuard, AdminRolesGuard)
@AdminRoles('SUPER_ADMIN')
@Controller('admin/admins')
export class AdminAccountsController {
  constructor(private readonly adminAccountsService: AdminAccountsService) {}

  @Get()
  @ApiOperation({ summary: '어드민 계정 목록 조회 (SUPER_ADMIN)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: 'SUPER_ADMIN 아님' })
  async getAdmins(): Promise<ApiSuccessResponse<{ admins: AdminProfile[] }>> {
    const result = await this.adminAccountsService.getAdmins();
    return createSuccessResponse('어드민 계정 목록 조회 완료', result);
  }

  @Post()
  @ApiOperation({ summary: '어드민 계정 생성 (SUPER_ADMIN)' })
  @ApiResponse({ status: 201, description: '생성 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패' })
  @ApiResponse({ status: 403, description: 'SUPER_ADMIN 아님' })
  @ApiResponse({ status: 409, description: '이미 등록된 이메일' })
  async createAdmin(@CurrentAdmin() admin: AdminPrincipal, @Body() dto: CreateAdminDto): Promise<ApiSuccessResponse<AdminProfile>> {
    const result = await this.adminAccountsService.createAdmin(admin, dto);
    return createSuccessResponse('어드민 계정 생성 완료', result);
  }

  @Patch(':adminId')
  @ApiOperation({ summary: '어드민 계정 수정 (SUPER_ADMIN)' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 400, description: '본인 강등·비활성화' })
  @ApiResponse({ status: 403, description: 'SUPER_ADMIN 아님' })
  @ApiResponse({ status: 404, description: '계정 없음' })
  async updateAdmin(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('adminId', ParseUUIDPipe) adminId: string,
    @Body() dto: UpdateAdminDto,
  ): Promise<ApiSuccessResponse<AdminProfile>> {
    const result = await this.adminAccountsService.updateAdmin(admin, adminId, dto);
    return createSuccessResponse('어드민 계정 수정 완료', result);
  }

  @Patch(':adminId/password')
  @ApiOperation({ summary: '어드민 비밀번호 초기화 (SUPER_ADMIN)' })
  @ApiResponse({ status: 200, description: '초기화 성공' })
  @ApiResponse({ status: 403, description: 'SUPER_ADMIN 아님' })
  @ApiResponse({ status: 404, description: '계정 없음' })
  async resetAdminPassword(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('adminId', ParseUUIDPipe) adminId: string,
    @Body() dto: ResetAdminPasswordDto,
  ): Promise<ApiSuccessResponse<{ adminId: string }>> {
    const result = await this.adminAccountsService.resetAdminPassword(admin, adminId, dto.newPassword);
    return createSuccessResponse('어드민 비밀번호 초기화 완료', result);
  }
}
