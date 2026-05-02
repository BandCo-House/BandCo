import { Module } from '@nestjs/common';

import { PrismaModule } from './database/prisma';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SongsModule } from './modules/songs/songs.module';
import { SpacesModule } from './modules/spaces/spaces.module';
import { AuthModule } from './auth/auth.module';
import { MembersModule } from './modules/members/members.module';

@Module({
  imports: [PrismaModule, SpacesModule, AuthModule, MembersModule, NotificationsModule, SongsModule],
})
export class AppModule {}
