import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';

import { SpacesPrismaRepository } from './repositories/spaces.prisma-repository';
import { SPACES_REPOSITORY } from './repositories/spaces.repository';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';

@Module({
  imports: [NotificationsModule],
  controllers: [SpacesController],
  providers: [
    SpacesService,
    SpacesPrismaRepository,
    {
      provide: SPACES_REPOSITORY,
      useExisting: SpacesPrismaRepository,
    },
  ],
})
export class SpacesModule {}
