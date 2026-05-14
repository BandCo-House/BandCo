import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';
import { BandMemberRole } from 'src/generated/prisma';

import type { GetMyBandsQuery } from './dto/get-my-bands-query.dto';
import type { BandsRepository, CreateBandRepositoryInput } from './repositories/bands.repository';
import { BandsService } from './bands.service';

const BAND_MASTER_USER_ID = '11111111-1111-4111-8111-111111111111';
const ROCK_GENRE_ID = '22222222-2222-4222-8222-222222222222';
const JAZZ_GENRE_ID = '33333333-3333-4333-8333-333333333333';
const INVITEE_USER_ID = '44444444-4444-4444-8444-444444444444';
const MISSING_USER_ID = '55555555-5555-4555-8555-555555555555';

function createBandsRepositoryStub(options?: {
  existingGenreIds?: string[];
  existingUserIds?: string[];
  bandForDelete?: {
    id: string;
    bandMasterUserId: string;
  } | null;
  bandForRoleUpdate?: {
    id: string;
    bandMasterUserId: string;
  } | null;
  bandMemberForRoleUpdate?: {
    id: string;
    userId: string;
  } | null;
  onCreateBand?: (input: CreateBandRepositoryInput, tx: unknown) => void;
  onDeleteBand?: (bandId: string, deletedAt: Date, tx: unknown) => void;
  onFindBandForDelete?: (tx: unknown) => void;
  onFindBandForRoleUpdate?: (tx: unknown) => void;
  onFindBandMemberForRoleUpdate?: (tx: unknown) => void;
  onFindExistingGenreIds?: (tx: unknown) => void;
  onFindExistingUserIds?: (tx: unknown) => void;
  onFindMyBands?: (userId: string, query: GetMyBandsQuery, tx: unknown) => void;
  onUpdateBandMemberRole?: (bandMemberId: string, role: BandMemberRole, tx: unknown) => void;
}): BandsRepository {
  return {
    async createBand(input, tx) {
      options?.onCreateBand?.(input, tx);

      return {
        band: {
          id: 'band-001',
          name: input.name,
          description: input.description ?? null,
          visibility: input.visibility,
          coverImgUrl: input.coverImgUrl ?? null,
          genres: input.genreIds.map(genreId => ({
            id: genreId,
            name: genreId === ROCK_GENRE_ID ? 'rock' : 'jazz',
          })),
          bandMasterUserId: input.bandMasterUserId,
          createdAt: '2026-03-03T09:20:10.123Z',
          invitations: {
            success: input.inviteeUserIds.map(userId => ({
              userId,
              invitationId: `invitation-${userId}`,
            })),
            failed: [],
          },
        },
      };
    },
    async deleteBand(bandId, deletedAt, tx) {
      options?.onDeleteBand?.(bandId, deletedAt, tx);

      return {
        bandId,
        deletedAt: deletedAt.toISOString(),
      };
    },
    async findBandForDelete(_bandId, tx) {
      options?.onFindBandForDelete?.(tx);

      if (options?.bandForDelete !== undefined) {
        return options.bandForDelete;
      }

      return {
        id: 'band-001',
        bandMasterUserId: BAND_MASTER_USER_ID,
      };
    },
    async findMyBands(userId, query, tx) {
      options?.onFindMyBands?.(userId, query, tx);

      return {
        items: [
          {
            id: 'band-001',
            name: '합주하자',
            description: '주 1회 합주',
            visibility: true,
            myRole: BandMemberRole.BM,
            joinedAt: '2026-03-01T12:10:00.000Z',
            createdAt: '2026-03-01T12:00:00.000Z',
            memberCount: 20,
          },
        ],
        meta: {
          count: 1,
          take: query.take,
          cursor: {
            createdAt: '2026-03-01T12:00:00.000Z',
            id: 'band-001',
          },
          next: null,
        },
      };
    },
    async findBandForMemberRoleUpdate(_bandId, tx) {
      options?.onFindBandForRoleUpdate?.(tx);

      if (options?.bandForRoleUpdate !== undefined) {
        return options.bandForRoleUpdate;
      }

      return {
        id: 'band-001',
        bandMasterUserId: BAND_MASTER_USER_ID,
      };
    },
    async findBandMemberForRoleUpdate(_bandId, userId, tx) {
      options?.onFindBandMemberForRoleUpdate?.(tx);

      if (options?.bandMemberForRoleUpdate !== undefined) {
        return options.bandMemberForRoleUpdate;
      }

      return {
        id: 'band-member-001',
        userId,
      };
    },
    async findExistingGenreIds(genreIds, tx) {
      options?.onFindExistingGenreIds?.(tx);

      return options?.existingGenreIds ?? genreIds;
    },
    async findExistingUserIds(userIds, tx) {
      options?.onFindExistingUserIds?.(tx);

      return options?.existingUserIds ?? userIds;
    },
    async updateBandMemberRole(bandMemberId, input, tx) {
      options?.onUpdateBandMemberRole?.(bandMemberId, input.role, tx);

      return {
        member: {
          userId: 'target-user-001',
          role: input.role,
        },
      };
    },
  };
}

function createPrismaServiceStub(): PrismaService {
  const tx = {
    transactionClient: true,
  };

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

describe('BandsService', () => {
  describe('createBand', () => {
    it('인증 사용자를 밴드장으로 사용하고 생성 결과를 반환한다', async () => {
      let capturedInput: CreateBandRepositoryInput | undefined;
      const repository = createBandsRepositoryStub({
        onCreateBand(input) {
          capturedInput = input;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.createBand(BAND_MASTER_USER_ID, {
        name: '합주하자',
        description: '주 1회 합주하는 밴드입니다.',
        visibility: true,
        coverImgUrl: 'https://cdn.example.com/bands/cover.png',
        genreIds: [ROCK_GENRE_ID, ROCK_GENRE_ID, JAZZ_GENRE_ID],
        inviteeUserIds: [INVITEE_USER_ID, INVITEE_USER_ID],
      });

      expect(capturedInput?.bandMasterUserId).toBe(BAND_MASTER_USER_ID);
      expect(capturedInput?.genreIds).toEqual([ROCK_GENRE_ID, JAZZ_GENRE_ID]);
      expect(capturedInput?.inviteeUserIds).toEqual([INVITEE_USER_ID]);
      expect(result.band.name).toBe('합주하자');
      expect(result.band.genres).toHaveLength(2);
      expect(result.band.invitations.success).toHaveLength(1);
      expect(result.band.invitations.failed).toHaveLength(0);
    });

    it('존재하지 않는 장르가 있으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        existingGenreIds: [ROCK_GENRE_ID],
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.createBand(BAND_MASTER_USER_ID, {
          name: '합주하자',
          visibility: true,
          genreIds: [ROCK_GENRE_ID, JAZZ_GENRE_ID],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('초대할 수 없는 사용자를 실패 목록으로 분리한다', async () => {
      const repository = createBandsRepositoryStub({
        existingUserIds: [INVITEE_USER_ID],
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.createBand(BAND_MASTER_USER_ID, {
        name: '합주하자',
        visibility: true,
        inviteeUserIds: [INVITEE_USER_ID, BAND_MASTER_USER_ID, MISSING_USER_ID],
      });

      expect(result.band.invitations.success).toEqual([
        {
          userId: INVITEE_USER_ID,
          invitationId: `invitation-${INVITEE_USER_ID}`,
        },
      ]);
      expect(result.band.invitations.failed).toEqual([
        {
          userId: BAND_MASTER_USER_ID,
          reason: '밴드 생성자는 초대 대상이 될 수 없습니다.',
        },
        {
          userId: MISSING_USER_ID,
          reason: '존재하지 않거나 비활성화된 사용자입니다.',
        },
      ]);
    });

    it('검증과 생성을 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onFindExistingGenreIds(tx) {
          capturedTransactions.push(tx);
        },
        onFindExistingUserIds(tx) {
          capturedTransactions.push(tx);
        },
        onCreateBand(_input, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await service.createBand(BAND_MASTER_USER_ID, {
        name: '합주하자',
        visibility: true,
        genreIds: [ROCK_GENRE_ID],
        inviteeUserIds: [INVITEE_USER_ID],
      });

      expect(capturedTransactions).toHaveLength(3);
      expect(capturedTransactions[0]).toBe(capturedTransactions[1]);
      expect(capturedTransactions[1]).toBe(capturedTransactions[2]);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onFindExistingGenreIds(tx) {
          capturedTransactions.push(tx);
        },
        onFindExistingUserIds(tx) {
          capturedTransactions.push(tx);
        },
        onCreateBand(_input, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.createBand(
        BAND_MASTER_USER_ID,
        {
          name: '합주하자',
          visibility: true,
          genreIds: [ROCK_GENRE_ID],
          inviteeUserIds: [INVITEE_USER_ID],
        },
        externalTx as never,
      );

      expect(capturedTransactions).toHaveLength(3);
      expect(capturedTransactions[0]).toBe(externalTx);
      expect(capturedTransactions[1]).toBe(externalTx);
      expect(capturedTransactions[2]).toBe(externalTx);
    });
  });

  describe('deleteBand', () => {
    it('밴드장이 요청하면 deletedAt을 설정한다', async () => {
      let capturedDeletedAt: Date | undefined;
      const repository = createBandsRepositoryStub({
        onDeleteBand(_bandId, deletedAt) {
          capturedDeletedAt = deletedAt;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.deleteBand(BAND_MASTER_USER_ID, 'band-001');

      expect(result.bandId).toBe('band-001');
      expect(result.deletedAt).toBe(capturedDeletedAt?.toISOString());
    });

    it('밴드가 없거나 이미 삭제되었으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        bandForDelete: null,
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.deleteBand(BAND_MASTER_USER_ID, 'band-missing')).rejects.toThrow(NotFoundException);
    });

    it('밴드장이 아니면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        bandForDelete: {
          id: 'band-001',
          bandMasterUserId: '22222222-2222-4222-8222-222222222222',
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.deleteBand(BAND_MASTER_USER_ID, 'band-001')).rejects.toThrow(ForbiddenException);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onFindBandForDelete(tx) {
          capturedTransactions.push(tx);
        },
        onDeleteBand(_bandId, _deletedAt, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.deleteBand(BAND_MASTER_USER_ID, 'band-001', externalTx as never);

      expect(capturedTransactions).toHaveLength(2);
      expect(capturedTransactions[0]).toBe(externalTx);
      expect(capturedTransactions[1]).toBe(externalTx);
    });
  });

  describe('getMyBands', () => {
    it('인증 사용자가 속한 밴드 목록을 조회한다', async () => {
      let capturedUserId: string | undefined;
      let capturedQuery: GetMyBandsQuery | undefined;
      const query: GetMyBandsQuery = {
        take: 20,
      };
      const repository = createBandsRepositoryStub({
        onFindMyBands(userId, inputQuery) {
          capturedUserId = userId;
          capturedQuery = inputQuery;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.getMyBands(BAND_MASTER_USER_ID, query);

      expect(capturedUserId).toBe(BAND_MASTER_USER_ID);
      expect(capturedQuery).toBe(query);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].myRole).toBe(BandMemberRole.BM);
      expect(result.meta.take).toBe(20);
    });

    it('커서 날짜와 ID는 함께 입력해야 한다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.getMyBands(BAND_MASTER_USER_ID, {
          take: 20,
          cursor__created_at: '2026-03-01T12:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('커서 날짜가 유효하지 않으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.getMyBands(BAND_MASTER_USER_ID, {
          take: 20,
          cursor__created_at: 'invalid-date',
          cursor__id: '11111111-1111-4111-8111-111111111111',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('외부 transaction client를 repository로 전달한다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      let capturedTransaction: unknown;
      const repository = createBandsRepositoryStub({
        onFindMyBands(_userId, _query, tx) {
          capturedTransaction = tx;
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.getMyBands(
        BAND_MASTER_USER_ID,
        {
          take: 20,
        },
        externalTx as never,
      );

      expect(capturedTransaction).toBe(externalTx);
    });
  });

  describe('updateBandMemberRole', () => {
    it('밴드장이 ADMIN 또는 MEMBER로 변경할 수 있다', async () => {
      let capturedRole: BandMemberRole | undefined;
      const repository = createBandsRepositoryStub({
        onUpdateBandMemberRole(_bandMemberId, role) {
          capturedRole = role;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.updateBandMemberRole(BAND_MASTER_USER_ID, 'band-001', 'target-user-001', {
        role: BandMemberRole.ADMIN,
      });

      expect(capturedRole).toBe(BandMemberRole.ADMIN);
      expect(result.member.userId).toBe('target-user-001');
      expect(result.member.role).toBe(BandMemberRole.ADMIN);
    });

    it('BM 권한 부여를 허용하지 않는다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.updateBandMemberRole(BAND_MASTER_USER_ID, 'band-001', 'target-user-001', {
          role: BandMemberRole.BM,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('밴드가 없거나 삭제되었으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        bandForRoleUpdate: null,
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.updateBandMemberRole(BAND_MASTER_USER_ID, 'band-missing', 'target-user-001', {
          role: BandMemberRole.MEMBER,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('밴드장이 아니면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        bandForRoleUpdate: {
          id: 'band-001',
          bandMasterUserId: '22222222-2222-4222-8222-222222222222',
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.updateBandMemberRole(BAND_MASTER_USER_ID, 'band-001', 'target-user-001', {
          role: BandMemberRole.MEMBER,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('대상 멤버가 밴드에 없으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        bandMemberForRoleUpdate: null,
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.updateBandMemberRole(BAND_MASTER_USER_ID, 'band-001', 'target-user-missing', {
          role: BandMemberRole.MEMBER,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onFindBandForRoleUpdate(tx) {
          capturedTransactions.push(tx);
        },
        onFindBandMemberForRoleUpdate(tx) {
          capturedTransactions.push(tx);
        },
        onUpdateBandMemberRole(_bandMemberId, _role, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.updateBandMemberRole(
        BAND_MASTER_USER_ID,
        'band-001',
        'target-user-001',
        {
          role: BandMemberRole.MEMBER,
        },
        externalTx as never,
      );

      expect(capturedTransactions).toHaveLength(3);
      expect(capturedTransactions[0]).toBe(externalTx);
      expect(capturedTransactions[1]).toBe(externalTx);
      expect(capturedTransactions[2]).toBe(externalTx);
    });
  });
});
