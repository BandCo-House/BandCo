import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { UsersModule } from '../users/users.module';

import { PlacesPrismaRepository } from './repositories/places.prisma-repository';
import { PLACES_REPOSITORY } from './repositories/places.repository';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [PlacesController],
  providers: [
    AccessTokenGuard,
    PlacesService,
    PlacesPrismaRepository,
    {
      provide: PLACES_REPOSITORY,
      useExisting: PlacesPrismaRepository,
    },
  ],
})
export class PlacesModule {}
