import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './database/prisma';
import { BandsModule } from './modules/bands/bands.module';
import { BandSpacesModule } from './modules/bandspaces/bandspaces.module';
import { CommonModule } from './modules/common/common.module';
import { LinkPreviewsModule } from './modules/link-previews/link-previews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PlacesModule } from './modules/places/places.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { SongsModule } from './modules/songs/songs.module';
import { TeamsModule } from './modules/teams/teams.module';
import { UsersModule } from './modules/users/users.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env' : ['.env.development', '.env'],
    }),
    PrismaModule,
    StorageModule,
    BandSpacesModule,
    AuthModule,
    NotificationsModule,
    SongsModule,
    UsersModule,
    BandsModule,
    SchedulesModule,
    CommonModule,
    LinkPreviewsModule,
    PlacesModule,
    TeamsModule,
  ],
})
export class AppModule {}
