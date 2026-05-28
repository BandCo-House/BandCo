import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

import { BandsPrismaRepository } from './repositories/bands.prisma-repository';
import { BANDS_REPOSITORY } from './repositories/bands.repository';
import { BandInvitationsController } from './band-invitations.controller';
import { BandJoinRequestsController } from './band-join-requests.controller';
import { BandsController } from './bands.controller';
import { BandsService } from './bands.service';

@Module({
  imports: [AuthModule, UsersModule, NotificationsModule],
  controllers: [BandsController, BandInvitationsController, BandJoinRequestsController],
  providers: [
    AccessTokenGuard,
    BandsService,
    BandsPrismaRepository,
    {
      provide: BANDS_REPOSITORY,
      useExisting: BandsPrismaRepository,
    },
  ],
})
export class BandsModule {}
