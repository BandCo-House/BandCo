import { Module } from '@nestjs/common';

import { PrismaModule } from './database/prisma';
import { SpacesModule } from './modules/spaces/spaces.module';

@Module({
  imports: [PrismaModule, SpacesModule],
})
export class AppModule {}
