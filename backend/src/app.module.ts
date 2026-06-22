import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './database/prisma';
import { BandsModule } from './modules/bands/bands.module';
import { BandSpacesModule } from './modules/bandspaces/bandspaces.module';
import { CommonModule } from './modules/common/common.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PlacesModule } from './modules/places/places.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { SongsModule } from './modules/songs/songs.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BandSpacesModule,
    AuthModule,
    NotificationsModule,
    SongsModule,
    UsersModule,
    BandsModule,
    SchedulesModule,
    CommonModule,
    PlacesModule,
  ],
})
export class AppModule {}
