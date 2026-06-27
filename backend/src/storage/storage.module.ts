import { Global, Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AccessTokenGuard } from '../auth/guard/bearer-token.guard';
import { UsersModule } from '../modules/users/users.module';

import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Global()
@Module({
  imports: [AuthModule, UsersModule],
  controllers: [StorageController],
  providers: [StorageService, AccessTokenGuard],
  exports: [StorageService],
})
export class StorageModule {}
