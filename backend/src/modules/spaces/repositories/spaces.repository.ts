import type { GetBandSpacesQuery } from '../dto/get-band-spaces-query.dto';
import type { GetBandSpacesResult } from '../types/band-space-list-item.type';
import type { GetSpaceDetailResult } from '../types/space-detail.type';

export const SPACES_REPOSITORY = Symbol('SPACES_REPOSITORY');

export interface SpacesRepository {
  findBandSpaces(bandId: string, query: GetBandSpacesQuery): Promise<GetBandSpacesResult>;
  findDetailBySpaceId(spaceId: string): Promise<GetSpaceDetailResult | undefined>;
}
