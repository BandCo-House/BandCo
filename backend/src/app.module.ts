import { Module } from '@nestjs/common';

import { PrismaModule } from './database/prisma';
import { BandsModule } from './modules/bands/bands.module';
import { SpacesModule } from './modules/spaces/spaces.module';

@Module({
  imports: [PrismaModule, BandsModule, SpacesModule],
})
export class AppModule {}
