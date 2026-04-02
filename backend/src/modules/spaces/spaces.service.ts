import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { CreateBandSpaceInput } from './dto/create-band-space.dto';
import type { GetBandSpacesQuery } from './dto/get-band-spaces-query.dto';
import { SPACES_REPOSITORY, type SpacesRepository } from './repositories/spaces.repository';
import type { GetBandSpacesResult } from './types/band-space-list-item.type';
import type { CreateBandSpaceResult } from './types/create-band-space-result.type';
import type { GetSpaceDetailResult } from './types/space-detail.type';

@Injectable()
export class SpacesService {
  constructor(@Inject(SPACES_REPOSITORY) private readonly spacesRepository: SpacesRepository) {}

  async createBandSpace(bandId: string, input: CreateBandSpaceInput): Promise<CreateBandSpaceResult> {
    return this.spacesRepository.createBandSpace(bandId, input);
  }

  async getBandSpaces(bandId: string, query: GetBandSpacesQuery): Promise<GetBandSpacesResult> {
    return this.spacesRepository.findBandSpaces(bandId, query);
  }

  async getSpaceDetail(spaceId: string): Promise<GetSpaceDetailResult> {
    const spaceDetail = await this.spacesRepository.findDetailBySpaceId(spaceId);

    if (spaceDetail === undefined) {
      throw new NotFoundException('요청한 합주 공간을 찾을 수 없습니다.');
    }

    return spaceDetail;
  }
}
