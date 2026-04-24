import { Module } from '@nestjs/common';

import { PrismaModule } from './database/prisma';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SongsModule } from './modules/songs/songs.module';
import { SpacesModule } from './modules/spaces/spaces.module';

@Module({
  imports: [PrismaModule, SpacesModule, NotificationsModule, SongsModule],
})
export class AppModule {}
