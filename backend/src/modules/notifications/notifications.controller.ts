import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { User } from 'src/generated/prisma';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
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
}
