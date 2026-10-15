import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse, createSuccessResponse } from 'src/common/api-response';

import { AdminRoles } from '../core/decorator/admin-roles.decorator';
import { CurrentAdmin } from '../core/decorator/current-admin.decorator';
import { AdminRolesGuard } from '../core/guard/admin-roles.guard';
import { AdminAccessTokenGuard } from '../core/guard/admin-token.guard';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { UpdateAdminServiceSettingsDto } from './dto/update-admin-service-settings.dto';
import type { AdminServiceSettings } from './types/admin-service-settings.type';
import { AdminServiceSettingsService } from './admin-service-settings.service';

@ApiTags('어드민 - 서비스 설정')
@ApiBearerAuth('admin-access-token')
@UseGuards(AdminAccessTokenGuard, AdminRolesGuard)
@Controller('admin/service-settings')
export class AdminServiceSettingsController {
  constructor(private readonly adminServiceSettingsService: AdminServiceSettingsService) {}

  @Get()
  @ApiOperation({ summary: '서비스 설정 조회' })
  @ApiResponse({ status: 200, description: '조회 성공 (저장한 적이 없으면 기본값)' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getServiceSettings(): Promise<ApiSuccessResponse<AdminServiceSettings>> {
    const result = await this.adminServiceSettingsService.getServiceSettings();
    return createSuccessResponse('서비스 설정 조회 완료', result);
  }

  @Patch()
  @AdminRoles('SUPER_ADMIN')
  @ApiOperation({ summary: '서비스 설정 변경 (SUPER_ADMIN)' })
  @ApiResponse({ status: 200, description: '변경 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패 (버전 형식, 문구 길이)' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: 'SUPER_ADMIN 아님' })
  async updateServiceSettings(
    @CurrentAdmin() admin: AdminPrincipal,
    @Body() dto: UpdateAdminServiceSettingsDto,
  ): Promise<ApiSuccessResponse<AdminServiceSettings>> {
    const result = await this.adminServiceSettingsService.updateServiceSettings(admin, dto);
    return createSuccessResponse('서비스 설정 변경 완료', result);
  }
}
