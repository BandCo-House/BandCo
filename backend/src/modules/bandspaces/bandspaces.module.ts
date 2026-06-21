import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';

import { BandSpacesPrismaRepository } from './repositories/bandspaces.prisma-repository';
import { BAND_SPACES_REPOSITORY } from './repositories/bandspaces.repository';
import { BandSpacesController } from './bandspaces.controller';
import { BandSpacesService } from './bandspaces.service';

@Module({
  imports: [NotificationsModule],
  controllers: [BandSpacesController],
  providers: [
    BandSpacesService,
    BandSpacesPrismaRepository,
    {
      provide: BAND_SPACES_REPOSITORY,
      useExisting: BandSpacesPrismaRepository,
    },
  ],
})
export class BandSpacesModule {}
