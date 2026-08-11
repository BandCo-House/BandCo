import { Body, Controller, Delete, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from 'src/modules/users/repositoreis/user.repository';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { DeleteManyNotificationsDto } from './dto/delete-many-notifications.dto';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { MarkManyReadDto } from './dto/mark-many-read.dto';
import type { DeleteManyNotificationsResult } from './types/delete-many-notifications-result.type';
import type { DeleteNotificationResult } from './types/delete-notification-result.type';
import type { MarkAllReadResult } from './types/mark-all-read-result.type';
import type { MarkManyReadResult } from './types/mark-many-read-result.type';
import type { MarkNotificationReadResult } from './types/mark-notification-read-result.type';
import type { GetNotificationsResult } from './types/notification-list-item.type';
import type { NotificationUnreadSummary } from './types/notification-unread-summary.type';
import { NotificationsService } from './notifications.service';

@ApiTags('알림')
@ApiBearerAuth('access-token')
@Controller('notifications')
@UseGuards(AccessTokenGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('unread-summary')
  @ApiOperation({ summary: '읽지 않은 알림 개수 조회' })
  @ApiResponse({ status: 200, description: '읽지 않은 알림 개수 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getUnreadSummary(@Req() req: { user: AuthUser }): Promise<ApiSuccessResponse<NotificationUnreadSummary>> {
    const result = await this.notificationsService.getUnreadSummary(req.user.id);
    return createSuccessResponse('읽지 않은 알림 개수 조회 성공', result);
  }

  @Get('me')
  @ApiOperation({ summary: '알림 목록 조회' })
  @ApiResponse({ status: 200, description: '알림 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getNotifications(
    @Req() req: { user: AuthUser },
    @Query() query: GetNotificationsQueryDto,
  ): Promise<ApiSuccessResponse<GetNotificationsResult>> {
    const result = await this.notificationsService.getNotifications(req.user.id, query);
    return createSuccessResponse('알림 목록 조회 성공', result);
  }

  @Patch('read-all')
  @ApiOperation({ summary: '전체 알림 읽음 처리' })
  @ApiResponse({ status: 200, description: '전체 알림 읽음 처리 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async markAllNotificationsAsRead(@Req() req: { user: AuthUser }): Promise<ApiSuccessResponse<MarkAllReadResult>> {
    const result = await this.notificationsService.markAllNotificationsAsRead(req.user.id);
    return createSuccessResponse('전체 알림 읽음 처리 성공', result);
  }

  @Patch('read')
  @ApiOperation({ summary: '다건 알림 읽음 처리' })
  @ApiResponse({ status: 200, description: '다건 알림 읽음 처리 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async markManyNotificationsAsRead(@Req() req: { user: AuthUser }, @Body() dto: MarkManyReadDto): Promise<ApiSuccessResponse<MarkManyReadResult>> {
    const result = await this.notificationsService.markManyNotificationsAsRead(req.user.id, dto.notificationIds);
    return createSuccessResponse('다건 알림 읽음 처리 성공', result);
  }

  @Patch(':notificationId/read')
  @ApiOperation({ summary: '단건 알림 읽음 처리' })
  @ApiParam({ name: 'notificationId', description: '알림 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '알림 읽음 처리 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '알림을 찾을 수 없음' })
  async markNotificationAsRead(
    @Req() req: { user: AuthUser },
    @Param('notificationId') notificationId: string,
  ): Promise<ApiSuccessResponse<MarkNotificationReadResult>> {
    const result = await this.notificationsService.markNotificationAsRead(req.user.id, notificationId);
    return createSuccessResponse('알림 읽음 처리 성공', result);
  }

  @Delete()
  @ApiOperation({ summary: '다건 알림 삭제' })
  @ApiResponse({ status: 200, description: '다건 알림 삭제 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async deleteManyNotifications(
    @Req() req: { user: AuthUser },
    @Body() dto: DeleteManyNotificationsDto,
  ): Promise<ApiSuccessResponse<DeleteManyNotificationsResult>> {
    const result = await this.notificationsService.deleteManyNotifications(req.user.id, dto.notificationIds);
    return createSuccessResponse('다건 알림 삭제 성공', result);
  }

  @Delete(':notificationId')
  @ApiOperation({ summary: '단건 알림 삭제' })
  @ApiParam({ name: 'notificationId', description: '알림 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '알림 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '알림을 찾을 수 없음' })
  async deleteNotification(
    @Req() req: { user: AuthUser },
    @Param('notificationId') notificationId: string,
  ): Promise<ApiSuccessResponse<DeleteNotificationResult>> {
    const result = await this.notificationsService.deleteNotification(req.user.id, notificationId);
    return createSuccessResponse('알림 삭제 성공', result);
  }
}
