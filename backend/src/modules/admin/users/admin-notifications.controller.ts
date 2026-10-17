import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse, createSuccessResponse } from 'src/common/api-response';

import { AdminRoles } from '../core/decorator/admin-roles.decorator';
import { CurrentAdmin } from '../core/decorator/current-admin.decorator';
import { AdminRolesGuard } from '../core/guard/admin-roles.guard';
import { AdminAccessTokenGuard } from '../core/guard/admin-token.guard';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { SendAdminNoticeDto } from './dto/admin-notifications.dto';
import type { AdminNotificationIdResult, BroadcastAdminNotificationResult } from './types/admin-notification.type';
import { AdminNotificationsService } from './admin-notifications.service';

@ApiTags('어드민 - 알림')
@ApiBearerAuth('admin-access-token')
@UseGuards(AdminAccessTokenGuard, AdminRolesGuard)
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly adminNotificationsService: AdminNotificationsService) {}

  @Post('broadcast')
  @AdminRoles('SUPER_ADMIN')
  @ApiOperation({ summary: '전체 회원 공지 알림 발송 (SUPER_ADMIN)' })
  @ApiResponse({ status: 201, description: '발송 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: 'SUPER_ADMIN 아님' })
  async broadcastNotice(
    @CurrentAdmin() admin: AdminPrincipal,
    @Body() dto: SendAdminNoticeDto,
  ): Promise<ApiSuccessResponse<BroadcastAdminNotificationResult>> {
    const result = await this.adminNotificationsService.broadcastNotice(admin, dto);
    return createSuccessResponse('전체 알림 발송 완료', result);
  }

  @Post(':notificationId/resend')
  @ApiOperation({ summary: '알림 재발송' })
  @ApiResponse({ status: 201, description: '재발송 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '알림 없음' })
  async resendNotification(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ): Promise<ApiSuccessResponse<AdminNotificationIdResult>> {
    const result = await this.adminNotificationsService.resendNotification(admin, notificationId);
    return createSuccessResponse('알림 재발송 완료', result);
  }
}
