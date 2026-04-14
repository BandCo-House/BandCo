import type { AddSpaceMemberInput } from '../dto/add-space-member.dto';
import type { CreateBandSpaceInput } from '../dto/create-band-space.dto';
import type { GetBandSpacesQuery } from '../dto/get-band-spaces-query.dto';
import type { AddSpaceMemberResult } from '../types/add-space-member-result.type';
import type { GetBandSpacesResult } from '../types/band-space-list-item.type';
import type { CreateBandSpaceResult } from '../types/create-band-space-result.type';
import type { GetSpaceDetailResult } from '../types/space-detail.type';

export const SPACES_REPOSITORY = Symbol('SPACES_REPOSITORY');

export interface SpacesRepository {
  addSpaceMember(spaceId: string, input: AddSpaceMemberInput): Promise<AddSpaceMemberResult>;
  createBandSpace(bandId: string, input: CreateBandSpaceInput): Promise<CreateBandSpaceResult>;
  findBandSpaces(bandId: string, query: GetBandSpacesQuery): Promise<GetBandSpacesResult>;
  findDetailBySpaceId(spaceId: string): Promise<GetSpaceDetailResult | undefined>;
}
