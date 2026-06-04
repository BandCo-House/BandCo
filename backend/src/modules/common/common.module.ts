import { Module } from '@nestjs/common';

import { CommonPrismaRepository } from './repositories/common.prisma-repository';
import { COMMON_REPOSITORY } from './repositories/common.repository';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';

@Module({
  controllers: [CommonController],
  providers: [
    CommonService,
    CommonPrismaRepository,
    {
      provide: COMMON_REPOSITORY,
      useExisting: CommonPrismaRepository,
    },
  ],
  exports: [CommonService],
})
export class CommonModule {}
