import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { DeezerTrackClient } from 'src/modules/songs/deezer-track.client';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';

import { SelfUserGuard } from './guard/self-user.guard';
import { ProfileMusicPrismaRepository } from './repositoreis/profile-music.prisma-repository';
import { PROFILE_MUSIC_REPOSITORY } from './repositoreis/profile-music.repository';
import { UsersPrismaRepository } from './repositoreis/user.prisma-repository';
import { USERS_REPOSITORY } from './repositoreis/user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [JwtModule.register({}), forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [
    UsersService,
    AccessTokenGuard,
    SelfUserGuard,
    DeezerTrackClient,
    { provide: USERS_REPOSITORY, useClass: UsersPrismaRepository },
    { provide: PROFILE_MUSIC_REPOSITORY, useClass: ProfileMusicPrismaRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}
