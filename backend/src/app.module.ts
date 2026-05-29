import { AuthModule } from './auth/auth.module';
import { BandsModule } from './modules/bands/bands.module';
<<<<<<< HEAD
import { CommonModule } from './modules/common/common.module';
=======
import { Module } from '@nestjs/common';
>>>>>>> 37c86a5 (✨ feat: places 모듈 기반 구조 추가)
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PlacesModule } from './modules/places/places.module';
import { PrismaModule } from './database/prisma';
import { SongsModule } from './modules/songs/songs.module';
import { SpacesModule } from './modules/spaces/spaces.module';
import { UsersModule } from './modules/users/users.module';

@Module({
<<<<<<< HEAD
  imports: [PrismaModule, SpacesModule, AuthModule, NotificationsModule, SongsModule, UsersModule, BandsModule, CommonModule],
=======
  imports: [PrismaModule, SpacesModule, AuthModule, NotificationsModule, SongsModule, UsersModule, BandsModule, PlacesModule],
>>>>>>> 37c86a5 (✨ feat: places 모듈 기반 구조 추가)
})
export class AppModule {}
