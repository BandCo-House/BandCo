import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

import { BandSpacesPrismaRepository } from './repositories/bandspaces.prisma-repository';
import { BAND_SPACES_REPOSITORY } from './repositories/bandspaces.repository';
import { BandSpacesController } from './bandspaces.controller';
import { BandSpacesService } from './bandspaces.service';

@Module({
  imports: [AuthModule, UsersModule, NotificationsModule],
  controllers: [BandSpacesController],
  providers: [
    AccessTokenGuard,
    BandSpacesService,
    BandSpacesPrismaRepository,
    {
      provide: BAND_SPACES_REPOSITORY,
      useExisting: BandSpacesPrismaRepository,
    },
  ],
})
export class BandSpacesModule {}
