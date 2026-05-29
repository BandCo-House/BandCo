import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma';
import type { BandMemberRole, Prisma } from '../../../generated/prisma';
import type { CreatePlaceInput } from '../dto/create-place.dto';
import type { GetBandPlacesQuery } from '../dto/get-band-places-query.dto';
import type { UpdatePlaceInput } from '../dto/update-place.dto';
import type { CreatePlaceResult } from '../types/create-place-result.type';
import type { DeletePlaceResult } from '../types/delete-place-result.type';
import type { PlaceDetail } from '../types/place-detail.type';
import type { GetBandPlacesResult, PlaceListItem } from '../types/place-list.type';
import type { UpdatePlaceResult } from '../types/update-place-result.type';

import type { PlacesRepository } from './places.repository';

type PlaceRecord = Prisma.PlaceGetPayload<{
  select: {
    id: true;
    bandId: true;
    name: true;
    address: true;
    detailAddress: true;
    imageUrl: true;
    isActive: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

@Injectable()
export class PlacesPrismaRepository implements PlacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 삭제되지 않은 밴드를 ID로 조회한다.
   */
  async findActiveBandById(bandId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null> {
    const client = tx ?? this.prisma;

    return client.band.findFirst({
      where: { id: bandId, deletedAt: null },
      select: { id: true },
    });
  }

  /**
   * 밴드 멤버를 밴드 ID와 사용자 ID로 조회한다.
   */
  async findBandMemberByBandIdAndUserId(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string; role: BandMemberRole } | null> {
    const client = tx ?? this.prisma;

    return client.bandMember.findFirst({
      where: { bandId, userId },
      select: { id: true, role: true },
    });
  }

  /**
   * 밴드에 새 장소를 생성한다.
   */
  async createPlace(bandId: string, input: CreatePlaceInput, tx?: Prisma.TransactionClient): Promise<CreatePlaceResult> {
    const client = tx ?? this.prisma;

    const place = await client.place.create({
      data: {
        bandId,
        name: input.name,
        address: input.address,
        detailAddress: input.detailAddress,
        imageUrl: input.imageUrl,
      },
      select: {
        id: true,
        bandId: true,
        name: true,
        address: true,
        detailAddress: true,
        imageUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      placeId: place.id,
      bandId: place.bandId,
      name: place.name,
      address: place.address,
      detailAddress: place.detailAddress,
      imageUrl: place.imageUrl,
      isActive: place.isActive,
      createdAt: place.createdAt.toISOString(),
    };
  }

  /**
   * 밴드 내 장소 목록을 커서 기반 페이지네이션으로 조회한다.
   */
  async findBandPlaces(bandId: string, query: GetBandPlacesQuery, tx?: Prisma.TransactionClient): Promise<GetBandPlacesResult> {
    const client = tx ?? this.prisma;

    const places = await client.place.findMany({
      where: {
        bandId,
        ...(query.where__is_active !== undefined ? { isActive: query.where__is_active } : {}),
        ...this.createCursorWhere(query),
      },
      select: {
        id: true,
        bandId: true,
        name: true,
        address: true,
        detailAddress: true,
        imageUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ createdAt: query.order__created_at.toLowerCase() as 'asc' | 'desc' }, { id: query.order__id.toLowerCase() as 'asc' | 'desc' }],
      take: query.take,
    });

    const items = places.map(place => this.mapPlaceListItem(place));
    const count = items.length;
    const cursor = count > 0 ? { createdAt: items[0].createdAt, id: places[0].id } : null;
    const lastItem = count === query.take ? items[count - 1] : null;
    const next = lastItem
      ? `/bands/${bandId}/places?cursor__created_at=${encodeURIComponent(lastItem.createdAt)}&cursor__id=${places[count - 1].id}&take=${query.take}&order__created_at=${query.order__created_at}&order__id=${query.order__id}`
      : null;

    return {
      bandId,
      items,
      meta: { count, take: query.take, cursor, next },
    };
  }

  /**
   * placeId로 단일 장소를 조회한다.
   */
  async findPlaceById(placeId: string, isActive?: boolean, tx?: Prisma.TransactionClient): Promise<PlaceDetail | null> {
    const client = tx ?? this.prisma;

    const place = await client.place.findFirst({
      where: {
        id: placeId,
        ...(isActive !== undefined ? { isActive } : {}),
      },
      select: {
        id: true,
        bandId: true,
        name: true,
        address: true,
        detailAddress: true,
        imageUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (place === null) {
      return null;
    }

    return {
      placeId: place.id,
      bandId: place.bandId,
      name: place.name,
      address: place.address,
      detailAddress: place.detailAddress,
      imageUrl: place.imageUrl,
      isActive: place.isActive,
      createdAt: place.createdAt.toISOString(),
      updatedAt: place.updatedAt.toISOString(),
    };
  }

  /**
   * 수정/삭제 권한 검증을 위해 장소를 isActive 무관하게 조회한다.
   */
  async findPlaceForMutation(placeId: string, tx?: Prisma.TransactionClient): Promise<{ id: string; bandId: string; isActive: boolean } | null> {
    const client = tx ?? this.prisma;

    return client.place.findFirst({
      where: { id: placeId },
      select: { id: true, bandId: true, isActive: true },
    });
  }

  /**
   * 장소 정보를 부분 수정하고 결과를 반환한다.
   */
  async updatePlace(placeId: string, input: UpdatePlaceInput, tx?: Prisma.TransactionClient): Promise<UpdatePlaceResult> {
    const client = tx ?? this.prisma;

    const place = await client.place.update({
      where: { id: placeId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.detailAddress !== undefined ? { detailAddress: input.detailAddress } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      },
      select: {
        id: true,
        bandId: true,
        name: true,
        address: true,
        detailAddress: true,
        imageUrl: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return {
      placeId: place.id,
      bandId: place.bandId,
      name: place.name,
      address: place.address,
      detailAddress: place.detailAddress,
      imageUrl: place.imageUrl,
      isActive: place.isActive,
      updatedAt: place.updatedAt.toISOString(),
    };
  }

  /**
   * 장소를 소프트 삭제한다. isActive를 false로 변경한다.
   */
  async deletePlace(placeId: string, tx?: Prisma.TransactionClient): Promise<DeletePlaceResult> {
    const client = tx ?? this.prisma;

    const place = await client.place.update({
      where: { id: placeId },
      data: { isActive: false },
      select: { id: true, bandId: true, isActive: true },
    });

    return {
      placeId: place.id,
      bandId: place.bandId,
      isActive: place.isActive,
    };
  }

  private createCursorWhere(query: GetBandPlacesQuery): Prisma.PlaceWhereInput {
    if (query.cursor__created_at === undefined || query.cursor__id === undefined) {
      return {};
    }

    const cursorCreatedAt = new Date(query.cursor__created_at);
    const op = query.order__created_at === 'DESC' ? 'lt' : 'gt';

    return {
      OR: [{ createdAt: { [op]: cursorCreatedAt } }, { createdAt: cursorCreatedAt, id: { [op]: query.cursor__id } }],
    };
  }

  private mapPlaceListItem(place: PlaceRecord): PlaceListItem {
    return {
      placeId: place.id,
      name: place.name,
      address: place.address,
      detailAddress: place.detailAddress,
      imageUrl: place.imageUrl,
      isActive: place.isActive,
      createdAt: place.createdAt.toISOString(),
      updatedAt: place.updatedAt.toISOString(),
    };
  }
}
