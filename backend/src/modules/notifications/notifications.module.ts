import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/modules/users/users.module';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';

import { NotificationsPrismaRepository } from './repositories/notifications.prisma-repository';
import { NOTIFICATIONS_REPOSITORY } from './repositories/notifications.repository';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    AccessTokenGuard,
    NotificationsPrismaRepository,
    {
      provide: NOTIFICATIONS_REPOSITORY,
      useExisting: NotificationsPrismaRepository,
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
