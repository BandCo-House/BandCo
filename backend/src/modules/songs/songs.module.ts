import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { UsersModule } from '../users/users.module';

import { SongsPrismaRepository } from './repositories/songs.prisma-repository';
import { SONGS_REPOSITORY } from './repositories/songs.repository';
import { DeezerTrackClient } from './deezer-track.client';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { SpotifyTrackClient } from './spotify-track.client';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [SongsController],
  providers: [
    AccessTokenGuard,
    SongsService,
    SpotifyTrackClient,
    DeezerTrackClient,
    SongsPrismaRepository,
    {
      provide: SONGS_REPOSITORY,
      useExisting: SongsPrismaRepository,
    },
  ],
})
export class SongsModule {}
