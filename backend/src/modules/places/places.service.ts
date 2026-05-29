import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import { type Prisma } from '../../generated/prisma';

import type { CreatePlaceInput } from './dto/create-place.dto';
import type { GetBandPlacesQuery } from './dto/get-band-places-query.dto';
import type { UpdatePlaceInput } from './dto/update-place.dto';
import { PLACES_REPOSITORY, type PlacesRepository } from './repositories/places.repository';
import type { CreatePlaceResult } from './types/create-place-result.type';
import type { PlaceDetail } from './types/place-detail.type';
import type { GetBandPlacesResult } from './types/place-list.type';
import type { UpdatePlaceResult } from './types/update-place-result.type';

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

  /**
   * 밴드 멤버만 해당 밴드의 장소 목록을 조회할 수 있다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} bandId - 조회할 밴드 ID
   * @param {GetBandPlacesQuery} query - 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetBandPlacesResult>} 장소 목록
   */
  async getBandPlaces(userId: string, bandId: string, query: GetBandPlacesQuery, tx?: Prisma.TransactionClient): Promise<GetBandPlacesResult> {
    const band = await this.placesRepository.findActiveBandById(bandId, tx);

    if (band === null) {
      throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
    }

    const member = await this.placesRepository.findBandMemberByBandIdAndUserId(bandId, userId, tx);

    if (member === null) {
      throw new ForbiddenException('밴드 멤버만 장소 목록을 조회할 수 있습니다.');
    }

    this.validateCursorPair(query);
    this.validateOrderDirections(query);

    return this.placesRepository.findBandPlaces(bandId, query, tx);
  }

  /**
   * 밴드 멤버만 장소를 상세 조회할 수 있다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} placeId - 조회할 장소 ID
   * @param {boolean | undefined} isActive - 활성 여부 필터
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<PlaceDetail>} 장소 상세 정보
   */
  async getPlace(userId: string, placeId: string, isActive?: boolean, tx?: Prisma.TransactionClient): Promise<PlaceDetail> {
    const place = await this.placesRepository.findPlaceById(placeId, isActive, tx);

    if (place === null) {
      throw new NotFoundException('요청한 장소를 찾을 수 없습니다.');
    }

    const member = await this.placesRepository.findBandMemberByBandIdAndUserId(place.bandId, userId, tx);

    if (member === null) {
      throw new ForbiddenException('밴드 멤버만 장소를 조회할 수 있습니다.');
    }

    return place;
  }

  /**
   * 밴드 멤버는 장소를 부분 수정할 수 있다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} placeId - 수정할 장소 ID
   * @param {UpdatePlaceInput} input - 검증이 끝난 장소 수정 요청값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<UpdatePlaceResult>} 수정된 장소 정보
   */
  async updatePlace(userId: string, placeId: string, input: UpdatePlaceInput, tx?: Prisma.TransactionClient): Promise<UpdatePlaceResult> {
    const run = async (client: Prisma.TransactionClient): Promise<UpdatePlaceResult> => {
      const place = await this.placesRepository.findPlaceForMutation(placeId, client);

      if (place === null) {
        throw new NotFoundException('요청한 장소를 찾을 수 없습니다.');
      }

      const member = await this.placesRepository.findBandMemberByBandIdAndUserId(place.bandId, userId, client);

      if (member === null) {
        throw new ForbiddenException('밴드 멤버만 장소를 수정할 수 있습니다.');
      }

      const hasUpdateField =
        input.name !== undefined || input.address !== undefined || input.detailAddress !== undefined || input.imageUrl !== undefined;

      if (!hasUpdateField) {
        throw new BadRequestException('수정할 장소 정보가 필요합니다.');
      }

      return this.placesRepository.updatePlace(placeId, input, client);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  private validateCursorPair(query: GetBandPlacesQuery): void {
    const hasCursorCreatedAt = query.cursor__created_at !== undefined;
    const hasCursorId = query.cursor__id !== undefined;

    if (hasCursorCreatedAt !== hasCursorId) {
      throw new BadRequestException('커서 조회에는 cursor__created_at과 cursor__id가 함께 필요합니다.');
    }
  }

  private validateOrderDirections(query: GetBandPlacesQuery): void {
    if (query.order__created_at !== query.order__id) {
      throw new BadRequestException('order__created_at과 order__id는 같은 방향이어야 합니다.');
    }
  }
}
