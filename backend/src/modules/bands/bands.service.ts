import { Inject, Injectable } from '@nestjs/common';

import type { CreateBandInput } from './dto/create-band.dto';
import { BANDS_REPOSITORY, type BandsRepository } from './repositories/bands.repository';
import type { CreateBandResult } from './types/create-band-result.type';

@Injectable()
export class BandsService {
  constructor(@Inject(BANDS_REPOSITORY) private readonly bandsRepository: BandsRepository) {}

  async createBand(input: CreateBandInput): Promise<CreateBandResult> {
    return this.bandsRepository.createBand(input);
  }
}
