import { Module } from '@nestjs/common';

import { SpacesPrismaRepository } from './repositories/spaces.prisma-repository';
import { SPACES_REPOSITORY } from './repositories/spaces.repository';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';

@Module({
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
