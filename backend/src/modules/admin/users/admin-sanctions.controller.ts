import { Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse, createSuccessResponse } from 'src/common/api-response';

import { CurrentAdmin } from '../core/decorator/current-admin.decorator';
import { AdminRolesGuard } from '../core/guard/admin-roles.guard';
import { AdminAccessTokenGuard } from '../core/guard/admin-token.guard';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import type { AdminSanction } from './types/admin-sanction.type';
import { AdminSanctionsService } from './admin-sanctions.service';

@ApiTags('어드민 - 제재')
@ApiBearerAuth('admin-access-token')
@UseGuards(AdminAccessTokenGuard, AdminRolesGuard)
@Controller('admin/sanctions')
export class AdminSanctionsController {
  constructor(private readonly adminSanctionsService: AdminSanctionsService) {}

  @Post(':sanctionId/revoke')
  @ApiOperation({ summary: '이용 정지 철회' })
  @ApiResponse({ status: 201, description: '철회 성공' })
  @ApiResponse({ status: 400, description: '경고이거나 이미 철회됨' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '제재 없음' })
  async revokeSanction(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('sanctionId', ParseUUIDPipe) sanctionId: string,
  ): Promise<ApiSuccessResponse<AdminSanction>> {
    const result = await this.adminSanctionsService.revokeSanction(admin, sanctionId);
    return createSuccessResponse('제재 철회 완료', result);
  }
}
