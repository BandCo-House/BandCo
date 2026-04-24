import { Module } from '@nestjs/common';

import { DeezerTrackClient } from './deezer-track.client';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { SpotifyTrackClient } from './spotify-track.client';

@Module({
  controllers: [SongsController],
  providers: [SongsService, SpotifyTrackClient, DeezerTrackClient],
})
export class SongsModule {}
