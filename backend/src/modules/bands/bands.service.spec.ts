import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';
import { BandMemberRole } from 'src/generated/prisma';

import type { GetBandJoinRequestsQuery } from './dto/get-band-join-requests-query.dto';
import type { GetBandMembersQuery } from './dto/get-band-members-query.dto';
import type { GetMyBandsQuery } from './dto/get-my-bands-query.dto';
import type { GetReceivedBandInvitationsQuery } from './dto/get-received-band-invitations-query.dto';
import type { GetSentBandInvitationsQuery } from './dto/get-sent-band-invitations-query.dto';
import type { GetSentBandJoinRequestsQuery } from './dto/get-sent-band-join-requests-query.dto';
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
  bandForJoinRequest?: {
    id: string;
    visibility: boolean;
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
  existingJoinRequest?: { id: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' } | null;
  joinRequestForResponse?: {
    id: string;
    bandId: string;
    userId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  } | null;
  invitationForResponse?: {
    id: string;
    bandId: string;
    inviterUserId: string;
    inviteeUserId: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  } | null;
  invitationForDelete?: {
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
    inviterUserId: string;
  } | null;
  bandBlacklist?: { id: string } | null;
  onAcceptBandInvitation?: (invitationId: string, bandId: string, userId: string, respondedAt: Date, tx: unknown) => void;
  onApproveBandJoinRequest?: (joinRequestId: string, bandId: string, userId: string, tx: unknown) => void;
  onCreateBand?: (input: CreateBandRepositoryInput, tx: unknown) => void;
  onCreateBandInvitation?: (input: { bandId: string; inviterBandMemberId: string; inviteeUserId: string; message?: string }, tx: unknown) => void;
  onCreateBandJoinRequest?: (input: { bandId: string; userId: string; message?: string }, tx: unknown) => void;
  onDeleteBand?: (bandId: string, deletedAt: Date, tx: unknown) => void;
  onDeleteBandInvitation?: (invitationId: string, tx: unknown) => void;
  onDeclineBandInvitation?: (invitationId: string, respondedAt: Date, tx: unknown) => void;
  onRejectBandJoinRequest?: (joinRequestId: string, tx: unknown) => void;
  onFindBandBlacklistByBandIdAndUserId?: (tx: unknown) => void;
  onFindActiveBandById?: (tx: unknown) => void;
  onFindBandForLeave?: (tx: unknown) => void;
  onFindBandForJoinRequest?: (tx: unknown) => void;
  onFindBandInvitationForDelete?: (tx: unknown) => void;
  onFindBandInvitationForResponse?: (tx: unknown) => void;
  onFindBandInvitationByBandIdAndInviteeUserId?: (tx: unknown) => void;
  onFindBandJoinRequestByBandIdAndUserId?: (tx: unknown) => void;
  onFindBandJoinRequestForResponse?: (tx: unknown) => void;
  onFindBandManagerUserIdsByBandId?: (bandId: string, tx: unknown) => void;
  onFindBandJoinRequests?: (bandId: string, query: GetBandJoinRequestsQuery, tx: unknown) => void;
  onFindBandMemberByBandIdAndUserId?: (tx: unknown) => void;
  onFindBandMembers?: (bandId: string, query: GetBandMembersQuery, tx: unknown) => void;
  onFindExistingGenreIds?: (tx: unknown) => void;
  onFindExistingUserIds?: (tx: unknown) => void;
  onFindMyBands?: (userId: string, query: GetMyBandsQuery, tx: unknown) => void;
  onFindReceivedBandInvitations?: (userId: string, query: GetReceivedBandInvitationsQuery, tx: unknown) => void;
  onFindSentBandJoinRequests?: (userId: string, query: GetSentBandJoinRequestsQuery, tx: unknown) => void;
  onFindSentBandInvitations?: (userId: string, query: GetSentBandInvitationsQuery, tx: unknown) => void;
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
    async approveBandJoinRequest(joinRequestId, bandId, userId, tx) {
      options?.onApproveBandJoinRequest?.(joinRequestId, bandId, userId, tx);

      return {
        joinRequestId,
        bandId,
        userId,
        joinRequestStatus: 'APPROVED',
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
    async rejectBandJoinRequest(joinRequestId, tx) {
      options?.onRejectBandJoinRequest?.(joinRequestId, tx);

      return {
        joinRequestId,
        bandId: 'band-001',
        userId: INVITEE_USER_ID,
        joinRequestStatus: 'REJECTED',
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
    async createBandJoinRequest(input, tx) {
      options?.onCreateBandJoinRequest?.(input, tx);

      return {
        joinRequestId: 'join-request-001',
        bandId: input.bandId,
        userId: input.userId,
        joinRequestStatus: 'PENDING',
        createdAt: '2026-04-30T10:00:00.000Z',
      };
    },
    async deleteBand(bandId, deletedAt, tx) {
      options?.onDeleteBand?.(bandId, deletedAt, tx);

      return {
        bandId,
        deletedAt: deletedAt.toISOString(),
      };
    },
    async deleteBandInvitation(invitationId, tx) {
      options?.onDeleteBandInvitation?.(invitationId, tx);

      return {
        invitationId,
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
    async findBandForJoinRequest(_bandId, tx) {
      options?.onFindBandForJoinRequest?.(tx);

      if (options?.bandForJoinRequest !== undefined) {
        return options.bandForJoinRequest;
      }

      return {
        id: 'band-001',
        visibility: true,
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
    async findReceivedBandInvitations(userId, query, tx) {
      options?.onFindReceivedBandInvitations?.(userId, query, tx);

      return {
        items: [
          {
            invitationId: 'invitation-001',
            band: {
              bandId: 'band-001',
              name: 'Rocking Stars',
              description: '직장인 밴드',
            },
            inviter: {
              userId: BAND_MASTER_USER_ID,
              nickname: 'Jun',
            },
            message: '같이 밴드 하실래요?',
            invitationStatus: query.where__invitation_status,
            createdAt: '2026-04-30T10:00:00.000Z',
          },
        ],
        meta: {
          count: 1,
          take: query.take,
          cursor: {
            id: 'invitation-001',
          },
          next: null,
        },
      };
    },
    async findSentBandInvitations(userId, query, tx) {
      options?.onFindSentBandInvitations?.(userId, query, tx);

      return {
        items: [
          {
            invitationId: 'invitation-001',
            band: {
              bandId: 'band-001',
              name: 'Rocking Stars',
              description: '직장인 밴드',
              memberCount: 5,
            },
            invitee: {
              userId: INVITEE_USER_ID,
              nickname: 'Choi',
              avatarUrl: null,
            },
            invitationStatus: query.where__invitation_status,
            message: '같이 합주해요!',
            createdAt: '2026-04-30T10:00:00.000Z',
            respondedAt: null,
          },
        ],
        meta: {
          count: 1,
          take: query.take,
          cursor: {
            id: 'invitation-001',
          },
          next: null,
        },
      };
    },
    async findSentBandJoinRequests(userId, query, tx) {
      options?.onFindSentBandJoinRequests?.(userId, query, tx);

      return {
        items: [
          {
            joinRequestId: 'join-request-001',
            band: {
              bandId: 'band-001',
              name: 'Rocking Stars',
              description: '직장인 밴드',
              visibility: true,
            },
            joinRequestStatus: query.where__join_request_status,
            message: '기타로 합류하고 싶습니다!',
            createdAt: '2026-04-30T10:00:00.000Z',
          },
        ],
        meta: {
          count: 1,
          take: query.take,
          cursor: {
            id: 'join-request-001',
          },
          next: null,
        },
      };
    },
    async findBandJoinRequests(bandId, query, tx) {
      options?.onFindBandJoinRequests?.(bandId, query, tx);

      return {
        items: [
          {
            joinRequestId: 'join-request-001',
            requester: {
              userId: INVITEE_USER_ID,
              nickname: 'Choi',
              avatarUrl: null,
            },
            joinRequestStatus: query.where__join_request_status,
            message: '기타로 합류하고 싶습니다!',
            createdAt: '2026-04-30T10:00:00.000Z',
          },
        ],
        meta: {
          count: 1,
          take: query.take,
          cursor: {
            id: 'join-request-001',
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
    async findBandJoinRequestByBandIdAndUserId(_bandId, _userId, tx) {
      options?.onFindBandJoinRequestByBandIdAndUserId?.(tx);

      return options?.existingJoinRequest ?? null;
    },
    async findBandJoinRequestForResponse(_joinRequestId, tx) {
      options?.onFindBandJoinRequestForResponse?.(tx);

      if (options?.joinRequestForResponse !== undefined) {
        return options.joinRequestForResponse;
      }

      return {
        id: 'join-request-001',
        bandId: 'band-001',
        userId: INVITEE_USER_ID,
        status: 'PENDING',
      };
    },
    async findBandManagerUserIdsByBandId(bandId, tx) {
      options?.onFindBandManagerUserIdsByBandId?.(bandId, tx);

      return [BAND_MASTER_USER_ID, ADMIN_USER_ID];
    },
    async findBandInvitationForResponse(_invitationId, tx) {
      options?.onFindBandInvitationForResponse?.(tx);

      if (options?.invitationForResponse !== undefined) {
        return options.invitationForResponse;
      }

      return {
        id: 'invitation-001',
        bandId: 'band-001',
        inviterUserId: BAND_MASTER_USER_ID,
        inviteeUserId: INVITEE_USER_ID,
        status: 'PENDING',
      };
    },
    async findBandInvitationForDelete(_invitationId, tx) {
      options?.onFindBandInvitationForDelete?.(tx);

      if (options?.invitationForDelete !== undefined) {
        return options.invitationForDelete;
      }

      return {
        id: 'invitation-001',
        status: 'PENDING',
        inviterUserId: BAND_MASTER_USER_ID,
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

    it('기존 가입 요청이 있으면 초대할 수 없다', async () => {
      const repository = createBandsRepositoryStub({
        existingUserIds: [INVITEE_USER_ID],
        existingJoinRequest: {
          id: 'join-request-001',
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
        onFindBandJoinRequestByBandIdAndUserId(tx) {
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

      expect(capturedTransactions).toHaveLength(8);
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

  describe('createBandJoinRequest', () => {
    it('인증 사용자가 공개 밴드에 가입 요청을 보낸다', async () => {
      let capturedInput: { bandId: string; userId: string; message?: string } | undefined;
      const repository = createBandsRepositoryStub({
        onCreateBandJoinRequest(input) {
          capturedInput = input;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.createBandJoinRequest(INVITEE_USER_ID, 'band-001', {
        message: '기타로 합류하고 싶습니다!',
      });

      expect(capturedInput).toEqual({
        bandId: 'band-001',
        userId: INVITEE_USER_ID,
        message: '기타로 합류하고 싶습니다!',
      });
      expect(result).toEqual({
        joinRequestId: 'join-request-001',
        bandId: 'band-001',
        userId: INVITEE_USER_ID,
        joinRequestStatus: 'PENDING',
        createdAt: '2026-04-30T10:00:00.000Z',
      });
    });

    it('밴드가 없거나 삭제되었으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        bandForJoinRequest: null,
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.createBandJoinRequest(INVITEE_USER_ID, 'band-missing', {})).rejects.toThrow(NotFoundException);
    });

    it('비공개 밴드에는 가입 요청을 보낼 수 없다', async () => {
      const repository = createBandsRepositoryStub({
        bandForJoinRequest: {
          id: 'band-001',
          visibility: false,
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.createBandJoinRequest(INVITEE_USER_ID, 'band-001', {})).rejects.toThrow(ForbiddenException);
    });

    it('이미 밴드 멤버이면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        inviteeBandMember: {
          id: 'band-member-002',
          userId: INVITEE_USER_ID,
          role: BandMemberRole.MEMBER,
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.createBandJoinRequest(INVITEE_USER_ID, 'band-001', {})).rejects.toThrow(ConflictException);
    });

    it('차단된 사용자는 가입 요청을 보낼 수 없다', async () => {
      const repository = createBandsRepositoryStub({
        bandBlacklist: {
          id: 'blacklist-001',
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.createBandJoinRequest(INVITEE_USER_ID, 'band-001', {})).rejects.toThrow(ForbiddenException);
    });

    it('기존 초대가 있으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        existingInvitation: {
          id: 'invitation-001',
          status: 'PENDING',
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.createBandJoinRequest(INVITEE_USER_ID, 'band-001', {})).rejects.toThrow(ConflictException);
    });

    it('기존 가입 요청이 있으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        existingJoinRequest: {
          id: 'join-request-001',
          status: 'PENDING',
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.createBandJoinRequest(INVITEE_USER_ID, 'band-001', {})).rejects.toThrow(ConflictException);
    });

    it('검증과 가입 요청 생성을 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onFindBandForJoinRequest(tx) {
          capturedTransactions.push(tx);
        },
        onFindBandMemberByBandIdAndUserId(tx) {
          capturedTransactions.push(tx);
        },
        onFindBandBlacklistByBandIdAndUserId(tx) {
          capturedTransactions.push(tx);
        },
        onFindBandInvitationByBandIdAndInviteeUserId(tx) {
          capturedTransactions.push(tx);
        },
        onFindBandJoinRequestByBandIdAndUserId(tx) {
          capturedTransactions.push(tx);
        },
        onCreateBandJoinRequest(_input, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await service.createBandJoinRequest(INVITEE_USER_ID, 'band-001', {});

      expect(capturedTransactions).toHaveLength(6);
      expect(new Set(capturedTransactions).size).toBe(1);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onCreateBandJoinRequest(_input, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.createBandJoinRequest(INVITEE_USER_ID, 'band-001', {}, externalTx as never);

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
          inviterUserId: BAND_MASTER_USER_ID,
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

  describe('approveBandJoinRequest', () => {
    it('BM이 대기 중인 가입 요청을 승인하고 멤버로 가입시킨다', async () => {
      let capturedInput: { joinRequestId: string; bandId: string; userId: string } | undefined;
      const repository = createBandsRepositoryStub({
        onApproveBandJoinRequest(joinRequestId, bandId, userId) {
          capturedInput = { joinRequestId, bandId, userId };
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.approveBandJoinRequest(BAND_MASTER_USER_ID, 'join-request-001');

      expect(capturedInput).toEqual({
        joinRequestId: 'join-request-001',
        bandId: 'band-001',
        userId: INVITEE_USER_ID,
      });
      expect(result).toEqual({
        joinRequestId: 'join-request-001',
        bandId: 'band-001',
        userId: INVITEE_USER_ID,
        joinRequestStatus: 'APPROVED',
        joinedAt: '2026-04-30T10:00:00.000Z',
      });
    });

    it('가입 요청이 없거나 밴드/사용자가 삭제되었으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        joinRequestForResponse: null,
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.approveBandJoinRequest(BAND_MASTER_USER_ID, 'join-request-missing')).rejects.toThrow(NotFoundException);
    });

    it('밴드 운영 권한이 없으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        requesterBandMember: {
          id: 'member-001',
          userId: BAND_MASTER_USER_ID,
          role: BandMemberRole.MEMBER,
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.approveBandJoinRequest(BAND_MASTER_USER_ID, 'join-request-001')).rejects.toThrow(ForbiddenException);
    });

    it('대기 중인 가입 요청이 아니면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        joinRequestForResponse: {
          id: 'join-request-001',
          bandId: 'band-001',
          userId: INVITEE_USER_ID,
          status: 'REJECTED',
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.approveBandJoinRequest(BAND_MASTER_USER_ID, 'join-request-001')).rejects.toThrow(ConflictException);
    });

    it('요청자가 이미 밴드 멤버이면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        inviteeBandMember: {
          id: 'member-002',
          userId: INVITEE_USER_ID,
          role: BandMemberRole.MEMBER,
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.approveBandJoinRequest(BAND_MASTER_USER_ID, 'join-request-001')).rejects.toThrow(ConflictException);
    });

    it('차단된 사용자의 가입 요청은 승인할 수 없다', async () => {
      const repository = createBandsRepositoryStub({
        bandBlacklist: {
          id: 'blacklist-001',
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.approveBandJoinRequest(BAND_MASTER_USER_ID, 'join-request-001')).rejects.toThrow(ForbiddenException);
    });

    it('검증과 승인을 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onFindBandJoinRequestForResponse(tx) {
          capturedTransactions.push(tx);
        },
        onFindBandMemberByBandIdAndUserId(tx) {
          capturedTransactions.push(tx);
        },
        onFindBandBlacklistByBandIdAndUserId(tx) {
          capturedTransactions.push(tx);
        },
        onApproveBandJoinRequest(_joinRequestId, _bandId, _userId, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await service.approveBandJoinRequest(BAND_MASTER_USER_ID, 'join-request-001');

      expect(capturedTransactions).toHaveLength(5);
      expect(new Set(capturedTransactions).size).toBe(1);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onApproveBandJoinRequest(_joinRequestId, _bandId, _userId, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.approveBandJoinRequest(BAND_MASTER_USER_ID, 'join-request-001', externalTx as never);

      expect(capturedTransactions).toEqual([externalTx]);
    });
  });

  describe('rejectBandJoinRequest', () => {
    it('BM이 대기 중인 가입 요청을 거절한다', async () => {
      let capturedJoinRequestId: string | undefined;
      const repository = createBandsRepositoryStub({
        onRejectBandJoinRequest(joinRequestId) {
          capturedJoinRequestId = joinRequestId;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.rejectBandJoinRequest(BAND_MASTER_USER_ID, 'join-request-001');

      expect(capturedJoinRequestId).toBe('join-request-001');
      expect(result).toEqual({
        joinRequestId: 'join-request-001',
        bandId: 'band-001',
        userId: INVITEE_USER_ID,
        joinRequestStatus: 'REJECTED',
      });
    });

    it('가입 요청이 없거나 밴드/사용자가 삭제되었으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        joinRequestForResponse: null,
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.rejectBandJoinRequest(BAND_MASTER_USER_ID, 'join-request-missing')).rejects.toThrow(NotFoundException);
    });

    it('밴드 운영 권한이 없으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        requesterBandMember: {
          id: 'member-001',
          userId: BAND_MASTER_USER_ID,
          role: BandMemberRole.MEMBER,
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.rejectBandJoinRequest(BAND_MASTER_USER_ID, 'join-request-001')).rejects.toThrow(ForbiddenException);
    });

    it('대기 중인 가입 요청이 아니면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        joinRequestForResponse: {
          id: 'join-request-001',
          bandId: 'band-001',
          userId: INVITEE_USER_ID,
          status: 'APPROVED',
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.rejectBandJoinRequest(BAND_MASTER_USER_ID, 'join-request-001')).rejects.toThrow(ConflictException);
    });

    it('검증과 거절을 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onFindBandJoinRequestForResponse(tx) {
          capturedTransactions.push(tx);
        },
        onFindBandMemberByBandIdAndUserId(tx) {
          capturedTransactions.push(tx);
        },
        onRejectBandJoinRequest(_joinRequestId, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await service.rejectBandJoinRequest(BAND_MASTER_USER_ID, 'join-request-001');

      expect(capturedTransactions).toHaveLength(3);
      expect(new Set(capturedTransactions).size).toBe(1);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onRejectBandJoinRequest(_joinRequestId, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.rejectBandJoinRequest(BAND_MASTER_USER_ID, 'join-request-001', externalTx as never);

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
          inviterUserId: BAND_MASTER_USER_ID,
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

  describe('deleteBandInvitation', () => {
    it('초대를 보낸 사용자가 대기 중인 초대를 취소한다', async () => {
      let capturedInvitationId: string | undefined;
      const repository = createBandsRepositoryStub({
        onDeleteBandInvitation(invitationId) {
          capturedInvitationId = invitationId;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.deleteBandInvitation(BAND_MASTER_USER_ID, 'invitation-001');

      expect(capturedInvitationId).toBe('invitation-001');
      expect(result).toEqual({
        invitationId: 'invitation-001',
      });
    });

    it('초대가 없거나 밴드가 삭제되었으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        invitationForDelete: null,
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.deleteBandInvitation(BAND_MASTER_USER_ID, 'invitation-missing')).rejects.toThrow(NotFoundException);
    });

    it('초대를 보낸 사용자가 아니면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub();
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.deleteBandInvitation(INVITEE_USER_ID, 'invitation-001')).rejects.toThrow(ForbiddenException);
    });

    it('대기 중인 초대가 아니면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        invitationForDelete: {
          id: 'invitation-001',
          status: 'ACCEPTED',
          inviterUserId: BAND_MASTER_USER_ID,
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(service.deleteBandInvitation(BAND_MASTER_USER_ID, 'invitation-001')).rejects.toThrow(ConflictException);
    });

    it('검증과 삭제를 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onFindBandInvitationForDelete(tx) {
          capturedTransactions.push(tx);
        },
        onDeleteBandInvitation(_invitationId, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await service.deleteBandInvitation(BAND_MASTER_USER_ID, 'invitation-001');

      expect(capturedTransactions).toHaveLength(2);
      expect(new Set(capturedTransactions).size).toBe(1);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onDeleteBandInvitation(_invitationId, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.deleteBandInvitation(BAND_MASTER_USER_ID, 'invitation-001', externalTx as never);

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

  describe('getReceivedBandInvitations', () => {
    it('인증 사용자가 받은 초대 목록을 조회한다', async () => {
      let capturedUserId: string | undefined;
      let capturedQuery: GetReceivedBandInvitationsQuery | undefined;
      const query: GetReceivedBandInvitationsQuery = {
        where__invitation_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      };
      const repository = createBandsRepositoryStub({
        onFindReceivedBandInvitations(userId, inputQuery) {
          capturedUserId = userId;
          capturedQuery = inputQuery;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.getReceivedBandInvitations(INVITEE_USER_ID, query);

      expect(capturedUserId).toBe(INVITEE_USER_ID);
      expect(capturedQuery).toBe(query);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].invitationStatus).toBe('PENDING');
      expect(result.meta.take).toBe(20);
    });

    it('외부 transaction client를 repository로 전달한다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      let capturedTransaction: unknown;
      const repository = createBandsRepositoryStub({
        onFindReceivedBandInvitations(_userId, _query, tx) {
          capturedTransaction = tx;
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.getReceivedBandInvitations(
        INVITEE_USER_ID,
        {
          where__invitation_status: 'PENDING',
          order__created_at: 'desc',
          order__id: 'desc',
          take: 20,
        },
        externalTx as never,
      );

      expect(capturedTransaction).toBe(externalTx);
    });
  });

  describe('getSentBandInvitations', () => {
    it('인증 사용자가 직접 보낸 초대 목록을 조회한다', async () => {
      let capturedUserId: string | undefined;
      let capturedQuery: GetSentBandInvitationsQuery | undefined;
      const query: GetSentBandInvitationsQuery = {
        where__invitation_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      };
      const repository = createBandsRepositoryStub({
        onFindSentBandInvitations(userId, inputQuery) {
          capturedUserId = userId;
          capturedQuery = inputQuery;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.getSentBandInvitations(BAND_MASTER_USER_ID, query);

      expect(capturedUserId).toBe(BAND_MASTER_USER_ID);
      expect(capturedQuery).toBe(query);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].invitationStatus).toBe('PENDING');
      expect(result.items[0].band.memberCount).toBe(5);
      expect(result.meta.take).toBe(20);
    });

    it('외부 transaction client를 repository로 전달한다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      let capturedTransaction: unknown;
      const repository = createBandsRepositoryStub({
        onFindSentBandInvitations(_userId, _query, tx) {
          capturedTransaction = tx;
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.getSentBandInvitations(
        BAND_MASTER_USER_ID,
        {
          where__invitation_status: 'PENDING',
          order__created_at: 'desc',
          order__id: 'desc',
          take: 20,
        },
        externalTx as never,
      );

      expect(capturedTransaction).toBe(externalTx);
    });
  });

  describe('getSentBandJoinRequests', () => {
    it('인증 사용자가 직접 보낸 가입 요청 목록을 조회한다', async () => {
      let capturedUserId: string | undefined;
      let capturedQuery: GetSentBandJoinRequestsQuery | undefined;
      const query: GetSentBandJoinRequestsQuery = {
        where__join_request_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      };
      const repository = createBandsRepositoryStub({
        onFindSentBandJoinRequests(userId, inputQuery) {
          capturedUserId = userId;
          capturedQuery = inputQuery;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.getSentBandJoinRequests(INVITEE_USER_ID, query);

      expect(capturedUserId).toBe(INVITEE_USER_ID);
      expect(capturedQuery).toBe(query);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].joinRequestStatus).toBe('PENDING');
      expect(result.items[0].band.visibility).toBe(true);
      expect(result.meta.take).toBe(20);
    });

    it('외부 transaction client를 repository로 전달한다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      let capturedTransaction: unknown;
      const repository = createBandsRepositoryStub({
        onFindSentBandJoinRequests(_userId, _query, tx) {
          capturedTransaction = tx;
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.getSentBandJoinRequests(
        INVITEE_USER_ID,
        {
          where__join_request_status: 'PENDING',
          order__created_at: 'desc',
          order__id: 'desc',
          take: 20,
        },
        externalTx as never,
      );

      expect(capturedTransaction).toBe(externalTx);
    });
  });

  describe('getBandJoinRequests', () => {
    it('밴드 운영자가 밴드로 들어온 가입 요청 목록을 조회한다', async () => {
      let capturedBandId: string | undefined;
      let capturedQuery: GetBandJoinRequestsQuery | undefined;
      const query: GetBandJoinRequestsQuery = {
        where__join_request_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      };
      const repository = createBandsRepositoryStub({
        onFindBandJoinRequests(bandId, inputQuery) {
          capturedBandId = bandId;
          capturedQuery = inputQuery;
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      const result = await service.getBandJoinRequests(BAND_MASTER_USER_ID, 'band-001', query);

      expect(capturedBandId).toBe('band-001');
      expect(capturedQuery).toBe(query);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].requester.userId).toBe(INVITEE_USER_ID);
      expect(result.items[0].joinRequestStatus).toBe('PENDING');
      expect(result.meta.take).toBe(20);
    });

    it('밴드가 없거나 삭제되었으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        activeBand: null,
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.getBandJoinRequests(BAND_MASTER_USER_ID, 'band-missing', {
          where__join_request_status: 'PENDING',
          order__created_at: 'desc',
          order__id: 'desc',
          take: 20,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('밴드 운영 권한이 없으면 예외를 던진다', async () => {
      const repository = createBandsRepositoryStub({
        requesterBandMember: {
          id: 'member-001',
          userId: BAND_MASTER_USER_ID,
          role: BandMemberRole.MEMBER,
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await expect(
        service.getBandJoinRequests(BAND_MASTER_USER_ID, 'band-001', {
          where__join_request_status: 'PENDING',
          order__created_at: 'desc',
          order__id: 'desc',
          take: 20,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('검증과 목록 조회를 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onFindActiveBandById(tx) {
          capturedTransactions.push(tx);
        },
        onFindBandMemberByBandIdAndUserId(tx) {
          capturedTransactions.push(tx);
        },
        onFindBandJoinRequests(_bandId, _query, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceStub());

      await service.getBandJoinRequests(BAND_MASTER_USER_ID, 'band-001', {
        where__join_request_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      });

      expect(capturedTransactions).toHaveLength(3);
      expect(new Set(capturedTransactions).size).toBe(1);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = {
        transactionClient: true,
      };
      const capturedTransactions: unknown[] = [];
      const repository = createBandsRepositoryStub({
        onFindBandJoinRequests(_bandId, _query, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandsService(repository, createPrismaServiceFailingTransactionStub());

      await service.getBandJoinRequests(
        BAND_MASTER_USER_ID,
        'band-001',
        {
          where__join_request_status: 'PENDING',
          order__created_at: 'desc',
          order__id: 'desc',
          take: 20,
        },
        externalTx as never,
      );

      expect(capturedTransactions).toEqual([externalTx]);
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
