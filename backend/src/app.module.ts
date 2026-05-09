import { Module } from '@nestjs/common';

import { PrismaModule } from './database/prisma';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SongsModule } from './modules/songs/songs.module';
import { SpacesModule } from './modules/spaces/spaces.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [PrismaModule, SpacesModule, AuthModule, NotificationsModule, SongsModule, UsersModule],
})
export class AppModule {}
