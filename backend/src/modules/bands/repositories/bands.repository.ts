import type { CreateBandInput } from '../dto/create-band.dto';
import type { CreateBandResult } from '../types/create-band-result.type';

export const BANDS_REPOSITORY = Symbol('BANDS_REPOSITORY');

export interface BandsRepository {
  createBand(input: CreateBandInput): Promise<CreateBandResult>;
}
