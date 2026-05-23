import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';
import { BandMemberRole } from 'src/generated/prisma';

import type { GetBandMembersQuery } from './dto/get-band-members-query.dto';
import type { GetMyBandsQuery } from './dto/get-my-bands-query.dto';
import type { SearchBandsQuery } from './dto/search-bands-query.dto';
import type { UpdateBandInput } from './dto/update-band.dto';
import type { BandsRepository, CreateBandRepositoryInput } from './repositories/bands.repository';
import { BandsService } from './bands.service';

const BAND_MASTER_USER_ID = '11111111-1111-4111-8111-111111111111';
const ROCK_GENRE_ID = '22222222-2222-4222-8222-222222222222';
const JAZZ_GENRE_ID = '33333333-3333-4333-8333-333333333333';
const INVITEE_USER_ID = '44444444-4444-4444-8444-444444444444';
const MISSING_USER_ID = '55555555-5555-4555-8555-555555555555';
const ADMIN_USER_ID = '66666666-6666-4666-8666-666666666666';

function createBandsRepositoryStub(options?: {
  existingGenreIds?: string[];
  existingUserIds?: string[];
  activeBand?: {
    id: string;
    bandMasterUserId: string;
  } | null;
  bandForLeave?: {
    id: string;
    member: {
      id: string;
      role: BandMemberRole;
    } | null;
  } | null;
  bandMemberForRoleUpdate?: {
    id: string;
    userId: string;
    role: BandMemberRole;
  } | null;
  requesterBandMember?: {
    id: string;
    userId: string;
    role: BandMemberRole;
  } | null;
  inviteeBandMember?: {
    id: string;
    userId: string;
    role: BandMemberRole;
  } | null;
  existingInvitation?: { id: string; status: 'PENDING' } | null;
  invitationForResponse?: {
    id: string;
    bandId: string;
    inviteeUserId: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  } | null;
  bandBlacklist?: { id: string } | null;
  onAcceptBandInvitation?: (invitationId: string, bandId: string, userId: string, respondedAt: Date, tx: unknown) => void;
  onCreateBand?: (input: CreateBandRepositoryInput, tx: unknown) => void;
  onCreateBandInvitation?: (input: { bandId: string; inviterBandMemberId: string; inviteeUserId: string; message?: string }, tx: unknown) => void;
  onDeleteBand?: (bandId: string, deletedAt: Date, tx: unknown) => void;
  onDeclineBandInvitation?: (invitationId: string, respondedAt: Date, tx: unknown) => void;
  onFindBandBlacklistByBandIdAndUserId?: (tx: unknown) => void;
  onFindActiveBandById?: (tx: unknown) => void;
  onFindBandForLeave?: (tx: unknown) => void;
  onFindBandInvitationForResponse?: (tx: unknown) => void;
  onFindBandInvitationByBandIdAndInviteeUserId?: (tx: unknown) => void;
  onFindBandMemberByBandIdAndUserId?: (tx: unknown) => void;
  onFindBandMembers?: (bandId: string, query: GetBandMembersQuery, tx: unknown) => void;
  onFindExistingGenreIds?: (tx: unknown) => void;
  onFindExistingUserIds?: (tx: unknown) => void;
  onFindMyBands?: (userId: string, query: GetMyBandsQuery, tx: unknown) => void;
  onLeaveBand?: (bandMemberId: string, tx: unknown) => void;
  onSearchBands?: (query: SearchBandsQuery, tx: unknown) => void;
  onUpdateBand?: (bandId: string, input: UpdateBandInput, tx: unknown) => void;
  onUpdateBandMemberRole?: (bandMemberId: string, role: BandMemberRole, tx: unknown) => void;
}): BandsRepository {
  return {
    async acceptBandInvitation(invitationId, bandId, userId, respondedAt, tx) {
      options?.onAcceptBandInvitation?.(invitationId, bandId, userId, respondedAt, tx);

      return {
        invitationId,
        bandId,
        userId,
        invitationStatus: 'ACCEPTED',
        joinedAt: '2026-04-30T10:00:00.000Z',
      };
    },
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
    async declineBandInvitation(invitationId, respondedAt, tx) {
      options?.onDeclineBandInvitation?.(invitationId, respondedAt, tx);

      return {
        invitationId,
        bandId: 'band-001',
        userId: INVITEE_USER_ID,
        invitationStatus: 'DECLINED',
        respondedAt: respondedAt.toISOString(),
      };
    },
    async createBandInvitation(input, tx) {
      options?.onCreateBandInvitation?.(input, tx);

      return {
        invitationId: 'invitation-001',
        bandId: input.bandId,
        inviterUserId: BAND_MASTER_USER_ID,
        inviteeUserId: input.inviteeUserId,
        invitationStatus: 'PENDING',
        createdAt: '2026-04-10T12:00:00.000Z',
      };
    },
    async deleteBand(bandId, deletedAt, tx) {
      options?.onDeleteBand?.(bandId, deletedAt, tx);

      return {
        bandId,
        deletedAt: deletedAt.toISOString(),
      };
    },
    async findActiveBandById(_bandId, tx) {
      options?.onFindActiveBandById?.(tx);

      if (options?.activeBand !== undefined) {
        return options.activeBand;
      }

      return {
        id: 'band-001',
        bandMasterUserId: BAND_MASTER_USER_ID,
      };
    },
    async findBandForLeave(_bandId, _userId, tx) {
      options?.onFindBandForLeave?.(tx);

      if (options?.bandForLeave !== undefined) {
        return options.bandForLeave;
      }

      return {
        id: 'band-001',
        member: {
          id: 'band-member-001',
          role: BandMemberRole.MEMBER,
        },
      };
    },
    async leaveBand(bandMemberId, tx) {
      options?.onLeaveBand?.(bandMemberId, tx);

      return {
        bandId: 'band-001',
        userId: INVITEE_USER_ID,
      };
    },
    async findBandMembers(bandId, query, tx) {
      options?.onFindBandMembers?.(bandId, query, tx);

      return {
        bandId,
        members: [
          {
            bandMemberId: 'band-member-001',
            userId: BAND_MASTER_USER_ID,
            nickname: 'Jun',
            avatarUrl: null,
            role: BandMemberRole.BM,
            joinedAt: '2026-04-10T00:00:00.000Z',
            skills: [
              {
                skillTypeId: 'skill-type-001',
                skillName: 'Guitar',
                skillLevel: 'ADVANCED',
                isPrimary: true,
              },
            ],
          },
        ],
        meta: {
          count: 1,
          take: query.take,
          cursor: {
            joinedAt: '2026-04-10T00:00:00.000Z',
            id: 'band-member-001',
          },
          next: null,
        },
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
    async searchBands(query, tx) {
      options?.onSearchBands?.(query, tx);

      return {
        keyword: query.where__name__contain ?? null,
        items: [
          {
            bandId: 'band-001',
            name: 'Rocking Stars',
            description: '주 1회 합주하는 직장인 밴드',
            visibility: true,
            memberCount: 5,
            bandMaster: {
              userId: BAND_MASTER_USER_ID,
              nickname: 'Jun',
            },
            createdAt: '2026-04-10T00:00:00.000Z',
          },
        ],
        meta: {
          count: 1,
          take: query.take,
          cursor: {
            createdAt: '2026-04-10T00:00:00.000Z',
            id: 'band-001',
          },
          next: null,
        },
      };
    },
    async updateBand(bandId, input, tx) {
      options?.onUpdateBand?.(bandId, input, tx);

      return {
        bandId,
        name: input.name ?? '합주하자',
        description: input.description ?? null,
        visibility: input.visibility ?? true,
        coverImgUrl: input.coverImgUrl ?? null,
        updatedAt: '2026-04-10T12:00:00.000Z',
      };
    },
    async findBandMemberByBandIdAndUserId(_bandId, userId, tx) {
      options?.onFindBandMemberByBandIdAndUserId?.(tx);

      if (userId === BAND_MASTER_USER_ID && options?.requesterBandMember !== undefined) {
        return options.requesterBandMember;
      }

      if (userId === ADMIN_USER_ID && options?.requesterBandMember !== undefined) {
        return options.requesterBandMember;
      }

      if (userId === INVITEE_USER_ID) {
        return options?.inviteeBandMember ?? null;
      }

      if (options?.bandMemberForRoleUpdate !== undefined) {
        return options.bandMemberForRoleUpdate;
      }

      return {
        id: 'band-member-001',
        userId,
        role: userId === BAND_MASTER_USER_ID ? BandMemberRole.BM : BandMemberRole.MEMBER,
      };
    },
    async findBandInvitationByBandIdAndInviteeUserId(_bandId, _inviteeUserId, tx) {
      options?.onFindBandInvitationByBandIdAndInviteeUserId?.(tx);

      return options?.existingInvitation ?? null;
    },
    async findBandInvitationForResponse(_invitationId, tx) {
      options?.onFindBandInvitationForResponse?.(tx);

      if (options?.invitationForResponse !== undefined) {
        return options.invitationForResponse;
      }

      return {
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: INVITEE_USER_ID,
        status: 'PENDING',
      };
    },
    async findBandBlacklistByBandIdAndUserId(_bandId, _userId, tx) {
      options?.onFindBandBlacklistByBandIdAndUserId?.(tx);

      return options?.bandBlacklist ?? null;
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
        genreIds: [ROCK_GENRE_ID, JAZZ_GENRE_ID],
        inviteeUserIds: [INVITEE_USER_ID],
      });

      expect(capturedInput?.bandMasterUserId).toBe(BAND_MASTER_USER_ID);
      expect(capturedInput?.genreIds).toEqual([ROCK_GENRE_ID, JAZZ_GENRE_ID]);
      expect(capturedInput?.inviteeUserIds).toEqual([INVITEE_USER_ID]);
      expect(result.band.name).toBe('합주하자');
      expect(result.band.genres).toHaveLength(2);
      expect(result.band.invitations.success).toHaveLength(1);
      expect(result.band.invitations.failed).toHaveLength(0);
    });

    it('중복된 장르가 있으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.createBand(BAND_MASTER_USER_ID, {
          name: '합주하자',
          visibility: true,
          genreIds: [ROCK_GENRE_ID, ROCK_GENRE_ID],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('중복된 초대 대상이 있으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.createBand(BAND_MASTER_USER_ID, {
          name: '합주하자',
          visibility: true,
          inviteeUserIds: [INVITEE_USER_ID, INVITEE_USER_ID],
        }),
      ).rejects.toThrow(BadRequestException);
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

  describe('createBandInvitation', () => {
    it('BM이 활성 사용자에게 밴드 초대를 보낸다', async () => {
      let capturedInput: { bandId: string; inviterBandMemberId: string; inviteeUserId: string; message?: string } | undefined;
      const repository = createBandsRepositoryStub({
        existingUserIds: [INVITEE_USER_ID],
        onCreateBandInvitation(input) {
          capturedInput = input;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.createBandInvitation(BAND_MASTER_USER_ID, 'band-001', {
        inviteeUserId: INVITEE_USER_ID,
        message: '같이 밴드 하실래요?',
      });

      expect(capturedInput).toEqual({
        bandId: 'band-001',
        inviterBandMemberId: 'band-member-001',
        inviteeUserId: INVITEE_USER_ID,
        message: '같이 밴드 하실래요?',
      });
      expect(result.invitationStatus).toBe('PENDING');
    });

    it('ADMIN도 밴드 초대를 보낼 수 있다', async () => {
      const repository = createBandsRepositoryStub({
        existingUserIds: [INVITEE_USER_ID],
        requesterBandMember: {
          id: 'admin-member-001',
          userId: ADMIN_USER_ID,
          role: BandMemberRole.ADMIN,
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.createBandInvitation(ADMIN_USER_ID, 'band-001', {
        inviteeUserId: INVITEE_USER_ID,
      });

      expect(result.inviteeUserId).toBe(INVITEE_USER_ID);
    });

    it('자기 자신에게 초대하면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.createBandInvitation(BAND_MASTER_USER_ID, 'band-001', {
          inviteeUserId: BAND_MASTER_USER_ID,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('밴드가 없거나 삭제되었으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        activeBand: null,
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.createBandInvitation(BAND_MASTER_USER_ID, 'band-missing', {
          inviteeUserId: INVITEE_USER_ID,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('요청자가 밴드 멤버가 아니면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        requesterBandMember: null,
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.createBandInvitation(BAND_MASTER_USER_ID, 'band-001', {
          inviteeUserId: INVITEE_USER_ID,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('일반 멤버가 초대하면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        requesterBandMember: {
          id: 'member-001',
          userId: BAND_MASTER_USER_ID,
          role: BandMemberRole.MEMBER,
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.createBandInvitation(BAND_MASTER_USER_ID, 'band-001', {
          inviteeUserId: INVITEE_USER_ID,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('존재하지 않거나 비활성화된 사용자를 초대하면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        existingUserIds: [],
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.createBandInvitation(BAND_MASTER_USER_ID, 'band-001', {
          inviteeUserId: MISSING_USER_ID,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('이미 밴드 멤버인 사용자를 초대하면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        existingUserIds: [INVITEE_USER_ID],
        inviteeBandMember: {
          id: 'invitee-member-001',
          userId: INVITEE_USER_ID,
          role: BandMemberRole.MEMBER,
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.createBandInvitation(BAND_MASTER_USER_ID, 'band-001', {
          inviteeUserId: INVITEE_USER_ID,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('차단된 사용자를 초대하면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        existingUserIds: [INVITEE_USER_ID],
        bandBlacklist: {
          id: 'blacklist-001',
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.createBandInvitation(BAND_MASTER_USER_ID, 'band-001', {
          inviteeUserId: INVITEE_USER_ID,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('기존 초대가 있으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        existingUserIds: [INVITEE_USER_ID],
        existingInvitation: {
          id: 'invitation-001',
          status: 'PENDING',
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.createBandInvitation(BAND_MASTER_USER_ID, 'band-001', {
          inviteeUserId: INVITEE_USER_ID,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('검증과 초대 생성을 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        existingUserIds: [INVITEE_USER_ID],
        onFindActiveBandById(tx) {
          capturedTransactions.push(tx);
        },
        onFindBandMemberByBandIdAndUserId(tx) {
          capturedTransactions.push(tx);
        },
        onFindExistingUserIds(tx) {
          capturedTransactions.push(tx);
        },
        onFindBandBlacklistByBandIdAndUserId(tx) {
          capturedTransactions.push(tx);
        },
        onFindBandInvitationByBandIdAndInviteeUserId(tx) {
          capturedTransactions.push(tx);
        },
        onCreateBandInvitation(_input, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await service.createBandInvitation(BAND_MASTER_USER_ID, 'band-001', {
        inviteeUserId: INVITEE_USER_ID,
      });

      expect(capturedTransactions).toHaveLength(7);
      expect(new Set(capturedTransactions).size).toBe(1);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        existingUserIds: [INVITEE_USER_ID],
        onCreateBandInvitation(_input, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.createBandInvitation(
        BAND_MASTER_USER_ID,
        'band-001',
        {
          inviteeUserId: INVITEE_USER_ID,
        },
        externalTx as never,
      );

      expect(capturedTransactions).toEqual([externalTx]);
    });
  });

  describe('acceptBandInvitation', () => {
    it('초대받은 사용자가 대기 중인 초대를 수락한다', async () => {
      let capturedRespondedAt: Date | undefined;
      const repository = createBandsRepositoryStub({
        onAcceptBandInvitation(_invitationId, _bandId, _userId, respondedAt) {
          capturedRespondedAt = respondedAt;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.acceptBandInvitation(INVITEE_USER_ID, 'invitation-001');

      expect(capturedRespondedAt).toBeInstanceOf(Date);
      expect(result).toEqual({
        invitationId: 'invitation-001',
        bandId: 'band-001',
        userId: INVITEE_USER_ID,
        invitationStatus: 'ACCEPTED',
        joinedAt: '2026-04-30T10:00:00.000Z',
      });
    });

    it('초대가 없거나 밴드가 삭제되었으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        invitationForResponse: null,
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.acceptBandInvitation(INVITEE_USER_ID, 'invitation-missing')).rejects.toThrow(NotFoundException);
    });

    it('초대받은 사용자가 아니면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.acceptBandInvitation(BAND_MASTER_USER_ID, 'invitation-001')).rejects.toThrow(ForbiddenException);
    });

    it('대기 중인 초대가 아니면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        invitationForResponse: {
          id: 'invitation-001',
          bandId: 'band-001',
          inviteeUserId: INVITEE_USER_ID,
          status: 'DECLINED',
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.acceptBandInvitation(INVITEE_USER_ID, 'invitation-001')).rejects.toThrow(ConflictException);
    });

    it('이미 밴드 멤버이면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        inviteeBandMember: {
          id: 'invitee-member-001',
          userId: INVITEE_USER_ID,
          role: BandMemberRole.MEMBER,
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.acceptBandInvitation(INVITEE_USER_ID, 'invitation-001')).rejects.toThrow(ConflictException);
    });

    it('검증과 수락 처리를 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onFindBandInvitationForResponse(tx) {
          capturedTransactions.push(tx);
        },
        onFindBandMemberByBandIdAndUserId(tx) {
          capturedTransactions.push(tx);
        },
        onAcceptBandInvitation(_invitationId, _bandId, _userId, _respondedAt, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await service.acceptBandInvitation(INVITEE_USER_ID, 'invitation-001');

      expect(capturedTransactions).toHaveLength(3);
      expect(new Set(capturedTransactions).size).toBe(1);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onAcceptBandInvitation(_invitationId, _bandId, _userId, _respondedAt, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.acceptBandInvitation(INVITEE_USER_ID, 'invitation-001', externalTx as never);

      expect(capturedTransactions).toEqual([externalTx]);
    });
  });

  describe('declineBandInvitation', () => {
    it('초대받은 사용자가 대기 중인 초대를 거절한다', async () => {
      let capturedRespondedAt: Date | undefined;
      const repository = createBandsRepositoryStub({
        onDeclineBandInvitation(_invitationId, respondedAt) {
          capturedRespondedAt = respondedAt;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.declineBandInvitation(INVITEE_USER_ID, 'invitation-001');

      expect(capturedRespondedAt).toBeInstanceOf(Date);
      expect(result).toEqual({
        invitationId: 'invitation-001',
        bandId: 'band-001',
        userId: INVITEE_USER_ID,
        invitationStatus: 'DECLINED',
        respondedAt: capturedRespondedAt?.toISOString(),
      });
    });

    it('초대가 없거나 밴드가 삭제되었으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        invitationForResponse: null,
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.declineBandInvitation(INVITEE_USER_ID, 'invitation-missing')).rejects.toThrow(NotFoundException);
    });

    it('초대받은 사용자가 아니면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.declineBandInvitation(BAND_MASTER_USER_ID, 'invitation-001')).rejects.toThrow(ForbiddenException);
    });

    it('대기 중인 초대가 아니면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        invitationForResponse: {
          id: 'invitation-001',
          bandId: 'band-001',
          inviteeUserId: INVITEE_USER_ID,
          status: 'ACCEPTED',
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.declineBandInvitation(INVITEE_USER_ID, 'invitation-001')).rejects.toThrow(ConflictException);
    });

    it('검증과 거절 처리를 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onFindBandInvitationForResponse(tx) {
          capturedTransactions.push(tx);
        },
        onDeclineBandInvitation(_invitationId, _respondedAt, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await service.declineBandInvitation(INVITEE_USER_ID, 'invitation-001');

      expect(capturedTransactions).toHaveLength(2);
      expect(new Set(capturedTransactions).size).toBe(1);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onDeclineBandInvitation(_invitationId, _respondedAt, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.declineBandInvitation(INVITEE_USER_ID, 'invitation-001', externalTx as never);

      expect(capturedTransactions).toEqual([externalTx]);
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
        activeBand: null,
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.deleteBand(BAND_MASTER_USER_ID, 'band-missing')).rejects.toThrow(NotFoundException);
    });

    it('밴드장이 아니면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        activeBand: {
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
        onFindActiveBandById(tx) {
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

  describe('leaveBand', () => {
    it('일반 멤버가 밴드를 나가면 멤버십을 삭제한다', async () => {
      let capturedBandMemberId: string | undefined;
      const repository = createBandsRepositoryStub({
        onLeaveBand(bandMemberId) {
          capturedBandMemberId = bandMemberId;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.leaveBand(INVITEE_USER_ID, 'band-001');

      expect(capturedBandMemberId).toBe('band-member-001');
      expect(result).toEqual({
        bandId: 'band-001',
        userId: INVITEE_USER_ID,
      });
    });

    it('밴드가 없거나 삭제되었으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        bandForLeave: null,
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.leaveBand(INVITEE_USER_ID, 'band-missing')).rejects.toThrow(NotFoundException);
    });

    it('밴드 멤버가 아니면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        bandForLeave: {
          id: 'band-001',
          member: null,
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.leaveBand(INVITEE_USER_ID, 'band-001')).rejects.toThrow(ForbiddenException);
    });

    it('밴드장은 이 API로 밴드를 나갈 수 없다', async () => {
      const repository = createBandsRepositoryStub({
        bandForLeave: {
          id: 'band-001',
          member: {
            id: 'band-member-001',
            role: BandMemberRole.BM,
          },
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.leaveBand(BAND_MASTER_USER_ID, 'band-001')).rejects.toThrow(ForbiddenException);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onFindBandForLeave(tx) {
          capturedTransactions.push(tx);
        },
        onLeaveBand(_bandMemberId, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.leaveBand(INVITEE_USER_ID, 'band-001', externalTx as never);

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

  describe('getBandMembers', () => {
    it('삭제되지 않은 밴드의 멤버 목록을 조회한다', async () => {
      let capturedBandId: string | undefined;
      let capturedQuery: GetBandMembersQuery | undefined;
      const query: GetBandMembersQuery = {
        order__joined_at: 'desc',
        order__id: 'desc',
        take: 20,
      };
      const repository = createBandsRepositoryStub({
        onFindBandMembers(bandId, inputQuery) {
          capturedBandId = bandId;
          capturedQuery = inputQuery;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.getBandMembers('band-001', query);

      expect(capturedBandId).toBe('band-001');
      expect(capturedQuery).toBe(query);
      expect(result.bandId).toBe('band-001');
      expect(result.members).toHaveLength(1);
      expect(result.members[0].skills[0].skillName).toBe('Guitar');
      expect(result.meta.take).toBe(20);
    });

    it('밴드가 없거나 삭제되었으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        activeBand: null,
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.getBandMembers('band-missing', {
          order__joined_at: 'desc',
          order__id: 'desc',
          take: 20,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('정렬 방향이 서로 다르면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.getBandMembers('band-001', {
          order__joined_at: 'desc',
          order__id: 'asc',
          take: 20,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('커서 가입일과 ID는 함께 입력해야 한다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.getBandMembers('band-001', {
          order__joined_at: 'desc',
          order__id: 'desc',
          take: 20,
          cursor__joined_at: '2026-04-10T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('커서 가입일이 유효하지 않으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.getBandMembers('band-001', {
          order__joined_at: 'desc',
          order__id: 'desc',
          take: 20,
          cursor__joined_at: 'invalid-date',
          cursor__id: '11111111-1111-4111-8111-111111111111',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('외부 transaction client를 repository로 전달한다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onFindActiveBandById(tx) {
          capturedTransactions.push(tx);
        },
        onFindBandMembers(_bandId, _query, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.getBandMembers(
        'band-001',
        {
          order__joined_at: 'desc',
          order__id: 'desc',
          take: 20,
        },
        externalTx as never,
      );

      expect(capturedTransactions).toHaveLength(2);
      expect(capturedTransactions[0]).toBe(externalTx);
      expect(capturedTransactions[1]).toBe(externalTx);
    });
  });

  describe('searchBands', () => {
    it('공개 밴드를 이름 기준으로 검색한다', async () => {
      let capturedQuery: SearchBandsQuery | undefined;
      const query: SearchBandsQuery = {
        where__name__contain: 'rock',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      };
      const repository = createBandsRepositoryStub({
        onSearchBands(inputQuery) {
          capturedQuery = inputQuery;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.searchBands(query);

      expect(capturedQuery).toBe(query);
      expect(result.keyword).toBe('rock');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].bandMaster.nickname).toBe('Jun');
      expect(result.meta.take).toBe(20);
    });

    it('정렬 방향이 서로 다르면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.searchBands({
          order__created_at: 'desc',
          order__id: 'asc',
          take: 20,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('커서 생성일과 ID는 함께 입력해야 한다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.searchBands({
          order__created_at: 'desc',
          order__id: 'desc',
          take: 20,
          cursor__created_at: '2026-04-10T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('커서 생성일이 유효하지 않으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.searchBands({
          order__created_at: 'desc',
          order__id: 'desc',
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
        onSearchBands(_query, tx) {
          capturedTransaction = tx;
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.searchBands(
        {
          order__created_at: 'desc',
          order__id: 'desc',
          take: 20,
        },
        externalTx as never,
      );

      expect(capturedTransaction).toBe(externalTx);
    });
  });

  describe('updateBand', () => {
    it('밴드장이 기본 정보를 수정할 수 있다', async () => {
      let capturedInput: UpdateBandInput | undefined;
      const repository = createBandsRepositoryStub({
        onUpdateBand(_bandId, input) {
          capturedInput = input;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.updateBand(BAND_MASTER_USER_ID, 'band-001', {
        name: 'Rocking Stars',
        description: '주 2회 합주하는 밴드',
        visibility: true,
        coverImgUrl: 'https://cdn.example.com/bands/cover.png',
      });

      expect(capturedInput?.name).toBe('Rocking Stars');
      expect(result.bandId).toBe('band-001');
      expect(result.name).toBe('Rocking Stars');
      expect(result.description).toBe('주 2회 합주하는 밴드');
      expect(result.coverImgUrl).toBe('https://cdn.example.com/bands/cover.png');
    });

    it('description과 coverImgUrl을 null로 제거할 수 있다', async () => {
      let capturedInput: UpdateBandInput | undefined;
      const repository = createBandsRepositoryStub({
        onUpdateBand(_bandId, input) {
          capturedInput = input;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.updateBand(BAND_MASTER_USER_ID, 'band-001', {
        description: null,
        coverImgUrl: null,
      });

      expect(capturedInput?.description).toBeNull();
      expect(capturedInput?.coverImgUrl).toBeNull();
      expect(result.description).toBeNull();
      expect(result.coverImgUrl).toBeNull();
    });

    it('수정할 필드가 없으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.updateBand(BAND_MASTER_USER_ID, 'band-001', {})).rejects.toThrow(BadRequestException);
    });

    it('밴드 이름이 빈 문자열이면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.updateBand(BAND_MASTER_USER_ID, 'band-001', {
          name: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('밴드가 없거나 삭제되었으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        activeBand: null,
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.updateBand(BAND_MASTER_USER_ID, 'band-missing', {
          name: 'Rocking Stars',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('밴드장이 아니면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        activeBand: {
          id: 'band-001',
          bandMasterUserId: '22222222-2222-4222-8222-222222222222',
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.updateBand(BAND_MASTER_USER_ID, 'band-001', {
          name: 'Rocking Stars',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onFindActiveBandById(tx) {
          capturedTransactions.push(tx);
        },
        onUpdateBand(_bandId, _input, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.updateBand(
        BAND_MASTER_USER_ID,
        'band-001',
        {
          name: 'Rocking Stars',
        },
        externalTx as never,
      );

      expect(capturedTransactions).toHaveLength(2);
      expect(capturedTransactions[0]).toBe(externalTx);
      expect(capturedTransactions[1]).toBe(externalTx);
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

    it('밴드장의 권한 변경을 허용하지 않는다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.updateBandMemberRole(BAND_MASTER_USER_ID, 'band-001', BAND_MASTER_USER_ID, {
          role: BandMemberRole.ADMIN,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('밴드가 없거나 삭제되었으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        activeBand: null,
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
        activeBand: {
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
        onFindActiveBandById(tx) {
          capturedTransactions.push(tx);
        },
        onFindBandMemberByBandIdAndUserId(tx) {
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
