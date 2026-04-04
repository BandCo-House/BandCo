import { Module } from '@nestjs/common';

import { PrismaModule } from './database/prisma';
import { SpacesModule } from './modules/spaces/spaces.module';
import { AuthModule } from './auth/auth.module';
import { MembersModule } from './modules/members/members.module';

@Module({
  imports: [PrismaModule, SpacesModule, AuthModule, MembersModule],
})
export class AppModule {}
