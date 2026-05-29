import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import { type Prisma } from '../../generated/prisma';

import type { CreatePlaceInput } from './dto/create-place.dto';
import { PLACES_REPOSITORY, type PlacesRepository } from './repositories/places.repository';
import type { CreatePlaceResult } from './types/create-place-result.type';

@Injectable()
export class PlacesService {
  constructor(
    @Inject(PLACES_REPOSITORY)
    private readonly placesRepository: PlacesRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 밴드 멤버만 장소를 생성할 수 있다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} bandId - 장소를 생성할 밴드 ID
   * @param {CreatePlaceInput} input - 검증이 끝난 장소 생성 요청값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<CreatePlaceResult>} 생성된 장소 정보
   */
  async createPlace(userId: string, bandId: string, input: CreatePlaceInput, tx?: Prisma.TransactionClient): Promise<CreatePlaceResult> {
    const run = async (client: Prisma.TransactionClient): Promise<CreatePlaceResult> => {
      const band = await this.placesRepository.findActiveBandById(bandId, client);

      if (band === null) {
        throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
      }

      const member = await this.placesRepository.findBandMemberByBandIdAndUserId(bandId, userId, client);

      if (member === null) {
        throw new ForbiddenException('밴드 멤버만 장소를 생성할 수 있습니다.');
      }

      return this.placesRepository.createPlace(bandId, input, client);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }
}
