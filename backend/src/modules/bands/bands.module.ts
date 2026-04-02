import { Module } from '@nestjs/common';

import { BandsPrismaRepository } from './repositories/bands.prisma-repository';
import { BANDS_REPOSITORY } from './repositories/bands.repository';
import { BandsController } from './bands.controller';
import { BandsService } from './bands.service';

@Module({
  controllers: [BandsController],
  providers: [
    BandsService,
    BandsPrismaRepository,
    {
      provide: BANDS_REPOSITORY,
      useExisting: BandsPrismaRepository,
    },
  ],
})
export class BandsModule {}
