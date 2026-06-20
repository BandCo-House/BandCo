import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

import { SchedulesPrismaRepository } from './repositories/schedules.prisma-repository';
import { SCHEDULES_REPOSITORY } from './repositories/schedules.repository';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  imports: [AuthModule, UsersModule, NotificationsModule],
  controllers: [SchedulesController],
  providers: [
    AccessTokenGuard,
    SchedulesService,
    SchedulesPrismaRepository,
    {
      provide: SCHEDULES_REPOSITORY,
      useExisting: SchedulesPrismaRepository,
    },
  ],
})
export class SchedulesModule {}
