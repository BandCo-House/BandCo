import { Module } from '@nestjs/common';

import { SpacesModule } from './modules/spaces/spaces.module';

@Module({
  imports: [SpacesModule],
})
export class AppModule {}
