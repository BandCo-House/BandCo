import { Module } from '@nestjs/common';

import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { SpotifyTrackClient } from './spotify-track.client';

@Module({
  controllers: [SongsController],
  providers: [SongsService, SpotifyTrackClient],
})
export class SongsModule {}
