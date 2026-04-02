import { Module } from '@nestjs/common';

import { NotificationsPrismaRepository } from './repositories/notifications.prisma-repository';
import { NOTIFICATIONS_REPOSITORY } from './repositories/notifications.repository';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsPrismaRepository,
    {
      provide: NOTIFICATIONS_REPOSITORY,
      useExisting: NotificationsPrismaRepository,
    },
  ],
})
export class NotificationsModule {}
