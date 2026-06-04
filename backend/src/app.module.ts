import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './database/prisma';
import { BandsModule } from './modules/bands/bands.module';
import { BandSpacesModule } from './modules/bandspaces/bandspaces.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { SongsModule } from './modules/songs/songs.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [PrismaModule, BandSpacesModule, AuthModule, NotificationsModule, SongsModule, UsersModule, BandsModule, SchedulesModule],
})
export class AppModule {}
