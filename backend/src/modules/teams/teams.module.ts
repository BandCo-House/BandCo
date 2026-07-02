import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';

import { TeamsPrismaRepository } from './repositories/teams.prisma-repository';
import { TEAMS_REPOSITORY } from './repositories/teams.repository';
import { BandTeamsController, TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [AuthModule],
  controllers: [BandTeamsController, TeamsController],
  providers: [
    AccessTokenGuard,
    TeamsService,
    TeamsPrismaRepository,
    {
      provide: TEAMS_REPOSITORY,
      useExisting: TeamsPrismaRepository,
    },
  ],
})
export class TeamsModule {}
