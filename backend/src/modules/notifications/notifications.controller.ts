import { Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import type { User } from 'src/generated/prisma';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import type { MarkNotificationReadResult } from './types/mark-notification-read-result.type';
import type { GetNotificationsResult } from './types/notification-list-item.type';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AccessTokenGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  async getNotifications(@Req() req: { user: User }, @Query() query: GetNotificationsQueryDto): Promise<ApiSuccessResponse<GetNotificationsResult>> {
    const result = await this.notificationsService.getNotifications(req.user.id, query);
    return createSuccessResponse('알림 목록 조회 성공', result);
  }

  @Patch(':notificationId/read')
  async markNotificationAsRead(
    @Req() req: { user: User },
    @Param('notificationId') notificationId: string,
  ): Promise<ApiSuccessResponse<MarkNotificationReadResult>> {
    const result = await this.notificationsService.markNotificationAsRead(req.user.id, notificationId);
    return createSuccessResponse('알림 읽음 처리 성공', result);
  }
}
