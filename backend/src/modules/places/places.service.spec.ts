import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';
import { BandMemberRole } from 'src/generated/prisma';

import type { CreatePlaceInput } from './dto/create-place.dto';
import type { GetBandPlacesQuery } from './dto/get-band-places-query.dto';
import type { UpdatePlaceInput } from './dto/update-place.dto';
import type { PlacesRepository } from './repositories/places.repository';
import type { CreatePlaceResult } from './types/create-place-result.type';
import type { DeletePlaceResult } from './types/delete-place-result.type';
import type { PlaceDetail } from './types/place-detail.type';
import type { GetBandPlacesResult } from './types/place-list.type';
import type { UpdatePlaceResult } from './types/update-place-result.type';
import { PlacesService } from './places.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const BAND_ID = '22222222-2222-4222-8222-222222222222';
const PLACE_ID = '33333333-3333-4333-8333-333333333333';
const MEMBER_ID = '44444444-4444-4444-8444-444444444444';

const DEFAULT_BAND = { id: BAND_ID };
const DEFAULT_MEMBER = { id: MEMBER_ID, role: BandMemberRole.MEMBER };
const DEFAULT_PLACE_FOR_MUTATION = { id: PLACE_ID, bandId: BAND_ID, isActive: true };
const DEFAULT_PLACE_DETAIL: PlaceDetail = {
  placeId: PLACE_ID,
  bandId: BAND_ID,
  name: '연습실',
  address: '서울',
  detailAddress: null,
  imageUrl: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const DEFAULT_CREATE_RESULT: CreatePlaceResult = {
  placeId: PLACE_ID,
  bandId: BAND_ID,
  name: '연습실',
  address: '서울',
  detailAddress: null,
  imageUrl: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};
const DEFAULT_BAND_PLACES_RESULT: GetBandPlacesResult = {
  bandId: BAND_ID,
  items: [],
  meta: { count: 0, take: 20, cursor: null, next: null },
};
const DEFAULT_UPDATE_RESULT: UpdatePlaceResult = {
  placeId: PLACE_ID,
  bandId: BAND_ID,
  name: '연습실',
  address: '서울',
  detailAddress: null,
  imageUrl: null,
  isActive: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const DEFAULT_DELETE_RESULT: DeletePlaceResult = {
  placeId: PLACE_ID,
  bandId: BAND_ID,
  isActive: false,
};

function createPrismaServiceStub(): PrismaService {
  const tx = { transactionClient: true };

  return {
    async $transaction(callback: (tx: unknown) => Promise<unknown>) {
      return callback(tx);
    },
  } as PrismaService;
}

function createPrismaServiceFailingTransactionStub(): PrismaService {
  return {
    async $transaction() {
      throw new Error('외부 tx가 있으면 새 transaction을 열지 않아야 합니다.');
    },
  } as unknown as PrismaService;
}

function createPlacesRepositoryStub(options?: {
  band?: { id: string } | null;
  member?: { id: string; role: BandMemberRole } | null;
  placeDetail?: PlaceDetail | null;
  placeForMutation?: { id: string; bandId: string; isActive: boolean } | null;
  bandPlacesResult?: GetBandPlacesResult;
  onCreatePlace?: (bandId: string, input: CreatePlaceInput, tx: unknown) => void;
  onUpdatePlace?: (placeId: string, input: UpdatePlaceInput, tx: unknown) => void;
  onDeletePlace?: (placeId: string, tx: unknown) => void;
}): PlacesRepository {
  return {
    async findActiveBandById(_bandId, _tx) {
      return options?.band !== undefined ? options.band : DEFAULT_BAND;
    },
    async findBandMemberByBandIdAndUserId(_bandId, _userId, _tx) {
      return options?.member !== undefined ? options.member : DEFAULT_MEMBER;
    },
    async createPlace(bandId, input, tx) {
      options?.onCreatePlace?.(bandId, input, tx);

      return DEFAULT_CREATE_RESULT;
    },
    async findBandPlaces(_bandId, _query, _tx) {
      return options?.bandPlacesResult ?? DEFAULT_BAND_PLACES_RESULT;
    },
    async findPlaceById(_placeId, _isActive, _tx) {
      return options?.placeDetail !== undefined ? options.placeDetail : DEFAULT_PLACE_DETAIL;
    },
    async findPlaceForMutation(_placeId, _tx) {
      return options?.placeForMutation !== undefined ? options.placeForMutation : DEFAULT_PLACE_FOR_MUTATION;
    },
    async updatePlace(placeId, input, tx) {
      options?.onUpdatePlace?.(placeId, input, tx);

      return { ...DEFAULT_UPDATE_RESULT, name: input.name ?? DEFAULT_UPDATE_RESULT.name };
    },
    async deletePlace(placeId, tx) {
      options?.onDeletePlace?.(placeId, tx);

      return DEFAULT_DELETE_RESULT;
    },
  };
}

describe('PlacesService', () => {
  describe('getBandPlaces', () => {
    const baseQuery: GetBandPlacesQuery = {
      order__created_at: 'DESC',
      order__id: 'DESC',
      take: 20,
    };

    it('장소 목록을 성공적으로 조회한다', async () => {
      const service = new PlacesService(createPlacesRepositoryStub(), createPrismaServiceStub());
      const result = await service.getBandPlaces(USER_ID, BAND_ID, baseQuery);

      expect(result.bandId).toBe(BAND_ID);
    });

    it('밴드가 없으면 NotFoundException을 던진다', async () => {
      const service = new PlacesService(createPlacesRepositoryStub({ band: null }), createPrismaServiceStub());

      await expect(service.getBandPlaces(USER_ID, BAND_ID, baseQuery)).rejects.toThrow(NotFoundException);
    });

    it('밴드 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const service = new PlacesService(createPlacesRepositoryStub({ member: null }), createPrismaServiceStub());

      await expect(service.getBandPlaces(USER_ID, BAND_ID, baseQuery)).rejects.toThrow(ForbiddenException);
    });

    it('cursor__created_at만 있고 cursor__id가 없으면 BadRequestException을 던진다', async () => {
      const service = new PlacesService(createPlacesRepositoryStub(), createPrismaServiceStub());
      const query = { ...baseQuery, cursor__created_at: '2026-01-01T00:00:00.000Z' };

      await expect(service.getBandPlaces(USER_ID, BAND_ID, query)).rejects.toThrow(BadRequestException);
    });

    it('order__created_at과 order__id 방향이 다르면 BadRequestException을 던진다', async () => {
      const service = new PlacesService(createPlacesRepositoryStub(), createPrismaServiceStub());
      const query = { ...baseQuery, order__created_at: 'DESC' as const, order__id: 'ASC' as const };

      await expect(service.getBandPlaces(USER_ID, BAND_ID, query)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPlace', () => {
    it('장소 상세를 성공적으로 조회한다', async () => {
      const service = new PlacesService(createPlacesRepositoryStub(), createPrismaServiceStub());
      const result = await service.getPlace(USER_ID, PLACE_ID);

      expect(result.placeId).toBe(PLACE_ID);
    });

    it('장소가 없으면 NotFoundException을 던진다', async () => {
      const service = new PlacesService(createPlacesRepositoryStub({ placeDetail: null }), createPrismaServiceStub());

      await expect(service.getPlace(USER_ID, PLACE_ID)).rejects.toThrow(NotFoundException);
    });

    it('밴드 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const service = new PlacesService(createPlacesRepositoryStub({ member: null }), createPrismaServiceStub());

      await expect(service.getPlace(USER_ID, PLACE_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createPlace', () => {
    it('장소를 성공적으로 생성한다', async () => {
      const service = new PlacesService(createPlacesRepositoryStub(), createPrismaServiceStub());
      const result = await service.createPlace(USER_ID, BAND_ID, { name: '연습실', address: '서울' });

      expect(result.placeId).toBe(PLACE_ID);
      expect(result.bandId).toBe(BAND_ID);
    });

    it('밴드가 없으면 NotFoundException을 던진다', async () => {
      const service = new PlacesService(createPlacesRepositoryStub({ band: null }), createPrismaServiceStub());

      await expect(service.createPlace(USER_ID, BAND_ID, { name: '연습실', address: '서울' })).rejects.toThrow(NotFoundException);
    });

    it('밴드 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const service = new PlacesService(createPlacesRepositoryStub({ member: null }), createPrismaServiceStub());

      await expect(service.createPlace(USER_ID, BAND_ID, { name: '연습실', address: '서울' })).rejects.toThrow(ForbiddenException);
    });

    it('tx가 있으면 같은 tx를 Repository에 전달한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createPlacesRepositoryStub({
        onCreatePlace: (_bandId, _input, tx) => {
          capturedTransactions.push(tx);
        },
      });

      repository.findActiveBandById = async (_bandId, tx) => {
        capturedTransactions.push(tx);

        return DEFAULT_BAND;
      };
      repository.findBandMemberByBandIdAndUserId = async (_bandId, _userId, tx) => {
        capturedTransactions.push(tx);

        return DEFAULT_MEMBER;
      };

      const service = new PlacesService(repository, createPrismaServiceStub());
      await service.createPlace(USER_ID, BAND_ID, { name: '연습실', address: '서울' });

      expect(capturedTransactions.length).toBeGreaterThan(0);
      const firstTx = capturedTransactions[0];
      capturedTransactions.forEach(tx => expect(tx).toBe(firstTx));
    });

    it('외부 tx가 있으면 새 $transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: true };
      const service = new PlacesService(createPlacesRepositoryStub(), createPrismaServiceFailingTransactionStub());

      await expect(service.createPlace(USER_ID, BAND_ID, { name: '연습실', address: '서울' }, externalTx as never)).resolves.toBeDefined();
    });
  });
});
