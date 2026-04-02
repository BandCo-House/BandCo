import { Controller, Get, Param, Patch, Query } from '@nestjs/common';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { type GetNotificationsQueryParams, parseGetNotificationsQuery } from './dto/get-notifications-query.dto';
import type { MarkNotificationReadResult } from './types/mark-notification-read-result.type';
import type { GetNotificationsResult } from './types/notification-list-item.type';
import type { UnreadNotificationCountResult } from './types/unread-notification-count-result.type';
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

  @Get('notifications/unread-count')
  async getUnreadNotificationCount(): Promise<ApiSuccessResponse<UnreadNotificationCountResult>> {
    const result = await this.notificationsService.getUnreadNotificationCount();

    return createSuccessResponse('읽지 않은 알림 개수 조회 성공', result);
  }

  @Patch('notifications/:notificationId/read')
  async markNotificationAsRead(@Param('notificationId') notificationId: string): Promise<ApiSuccessResponse<MarkNotificationReadResult>> {
    const result = await this.notificationsService.markNotificationAsRead(notificationId);

    return createSuccessResponse('알림 읽음 처리 성공', result);
  }
}
