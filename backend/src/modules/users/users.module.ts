import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersPrismaRepository } from './repositoreis/user.prisma-repository';
import { USERS_REPOSITORY } from './repositoreis/user.repository';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USERS_REPOSITORY,
      useClass: UsersPrismaRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
