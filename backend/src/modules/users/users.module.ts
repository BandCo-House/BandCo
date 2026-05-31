import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { DeezerTrackClient } from '../songs/deezer-track.client';

import { SelfUserGuard } from './guard/self-user.guard';
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
    {
      provide: USERS_REPOSITORY,
      useClass: UsersPrismaRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
