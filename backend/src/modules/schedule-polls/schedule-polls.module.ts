import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { UsersModule } from '../users/users.module';

import { SchedulePollsPrismaRepository } from './repositories/schedule-polls.prisma-repository';
import { SCHEDULE_POLLS_REPOSITORY } from './repositories/schedule-polls.repository';
import { SchedulePollsController } from './schedule-polls.controller';
import { SchedulePollsService } from './schedule-polls.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [SchedulePollsController],
  providers: [
    AccessTokenGuard,
    SchedulePollsService,
    SchedulePollsPrismaRepository,
    {
      provide: SCHEDULE_POLLS_REPOSITORY,
      useExisting: SchedulePollsPrismaRepository,
    },
  ],
})
export class SchedulePollsModule {}
