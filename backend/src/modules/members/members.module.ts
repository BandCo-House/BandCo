import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { MembersPrismaRepository } from './repositories/member.prisma-repository';
import { MEMBERS_REPOSITORY } from './repositories/member.repository';

@Module({
  exports: [MembersService],
  controllers: [MembersController],
  providers: [
    MembersService,
    {
      provide: MEMBERS_REPOSITORY,
      useClass: MembersPrismaRepository,
    },
  ],
})
export class MembersModule {}
