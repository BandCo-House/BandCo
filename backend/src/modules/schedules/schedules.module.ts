import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';

import { SchedulesPrismaRepository } from './repositories/schedules.prisma-repository';
import { SCHEDULES_REPOSITORY } from './repositories/schedules.repository';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  imports: [NotificationsModule],
  controllers: [SchedulesController],
  providers: [
    SchedulesService,
    SchedulesPrismaRepository,
    {
      provide: SCHEDULES_REPOSITORY,
      useExisting: SchedulesPrismaRepository,
    },
  ],
})
export class SchedulesModule {}
