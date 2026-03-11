import { Module } from '@nestjs/common';

import { SpacesMockRepository } from './repositories/spaces.mock-repository';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';

@Module({
  controllers: [SpacesController],
  providers: [SpacesService, SpacesMockRepository],
})
export class SpacesModule {}
