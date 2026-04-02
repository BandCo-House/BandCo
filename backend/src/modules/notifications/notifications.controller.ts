import { Controller, Get, Query } from '@nestjs/common';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { type GetNotificationsQueryParams, parseGetNotificationsQuery } from './dto/get-notifications-query.dto';
import type { GetNotificationsResult } from './types/notification-list-item.type';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('notifications')
  async getNotifications(@Query() rawQuery: GetNotificationsQueryParams): Promise<ApiSuccessResponse<GetNotificationsResult>> {
    const query = parseGetNotificationsQuery(rawQuery);
    const notifications = await this.notificationsService.getNotifications(query);

    return createSuccessResponse('알림 목록 조회 성공', notifications);
  }
}
