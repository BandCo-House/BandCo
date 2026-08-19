import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

import { BandInviteLinksPrismaRepository } from './repositories/band-invite-links.prisma-repository';
import { BAND_INVITE_LINKS_REPOSITORY } from './repositories/band-invite-links.repository';
import { BandsPrismaRepository } from './repositories/bands.prisma-repository';
import { BANDS_REPOSITORY } from './repositories/bands.repository';
import { BandInvitationsController } from './band-invitations.controller';
import { BandInviteLinksController } from './band-invite-links.controller';
import { BandInviteLinksService } from './band-invite-links.service';
import { BandJoinRequestsController } from './band-join-requests.controller';
import { BandsController } from './bands.controller';
import { BandsService } from './bands.service';

@Module({
  imports: [AuthModule, UsersModule, NotificationsModule],
  controllers: [BandsController, BandInvitationsController, BandJoinRequestsController, BandInviteLinksController],
  providers: [
    AccessTokenGuard,
    BandsService,
    BandsPrismaRepository,
    BandInviteLinksService,
    BandInviteLinksPrismaRepository,
    {
      provide: BANDS_REPOSITORY,
      useExisting: BandsPrismaRepository,
    },
    {
      provide: BAND_INVITE_LINKS_REPOSITORY,
      useExisting: BandInviteLinksPrismaRepository,
    },
  ],
})
export class BandsModule {}
