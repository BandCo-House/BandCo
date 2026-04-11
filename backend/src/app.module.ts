import { Module } from '@nestjs/common';

import { PrismaModule } from './database/prisma';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SpacesModule } from './modules/spaces/spaces.module';

@Module({
  imports: [PrismaModule, SpacesModule, NotificationsModule],
})
export class AppModule {}
