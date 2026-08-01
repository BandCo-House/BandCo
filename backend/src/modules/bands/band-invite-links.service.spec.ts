import { createHash } from 'node:crypto';

import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../../database/prisma';
import { BandMemberRole } from '../../generated/prisma';

import type { BandInviteLinksRepository } from './repositories/band-invite-links.repository';
import type { BandInviteLinkAccessContext, BandInviteLinkJoinContext, UpsertBandInviteLinkInput } from './types/band-invite-link.type';
import { BandInviteLinksService } from './band-invite-links.service';

const BAND_ID = '11111111-1111-4111-8111-111111111111';
const BAND_MEMBER_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = '33333333-3333-4333-8333-333333333333';
const NOW = new Date('2026-07-28T00:00:00.000Z');
const EXPIRED_AT = new Date('2099-07-28T00:00:00.000Z');

interface RepositoryStubOptions {
  accessContext?: BandInviteLinkAccessContext | null;
  inviteLink?: BandInviteLinkJoinContext | null;
  existingMember?: { id: string } | null;
  blacklist?: { id: string } | null;
  revoked?: boolean;
  onFindAccessContext?: (tx: unknown) => void;
  onUpsertInviteLink?: (input: UpsertBandInviteLinkInput, tx: unknown) => void;
  onDeleteInviteLink?: (tx: unknown) => void;
  onFindInviteLink?: (codeHash: string, tx: unknown) => void;
  onFindMember?: (tx: unknown) => void;
  onFindBlacklist?: (tx: unknown) => void;
  onCreateMember?: (tx: unknown) => void;
  onDeletePendingRequests?: (tx: unknown) => void;
}

function createRepositoryStub(options: RepositoryStubOptions = {}): BandInviteLinksRepository {
  return {
    async findActiveBandWithRequesterMember(_bandId, _userId, tx) {
      options.onFindAccessContext?.(tx);

      if (options.accessContext !== undefined) {
        return options.accessContext;
      }

      return {
        id: BAND_ID,
        member: {
          id: BAND_MEMBER_ID,
          role: BandMemberRole.BM,
        },
      };
    },
    async upsertBandInviteLink(input, tx) {
      options.onUpsertInviteLink?.(input, tx);

      return {
        bandId: input.bandId,
        expiredAt: input.expiredAt,
      };
    },
    async deleteBandInviteLinkByBandId(_bandId, tx) {
      options.onDeleteInviteLink?.(tx);
      return options.revoked ?? true;
    },
    async findBandInviteLinkByCodeHash(codeHash, tx) {
      options.onFindInviteLink?.(codeHash, tx);

      if (options.inviteLink !== undefined) {
        return options.inviteLink;
      }

      return {
        bandId: BAND_ID,
        expiredAt: EXPIRED_AT,
      };
    },
    async findBandMemberByBandIdAndUserId(_bandId, _userId, tx) {
      options.onFindMember?.(tx);
      return options.existingMember ?? null;
    },
    async findBandBlacklistByBandIdAndUserId(_bandId, _userId, tx) {
      options.onFindBlacklist?.(tx);
      return options.blacklist ?? null;
    },
    async createBandMember(_bandId, _userId, tx) {
      options.onCreateMember?.(tx);

      return {
        id: BAND_MEMBER_ID,
        joinedAt: NOW,
      };
    },
    async deletePendingBandEntryRequests(_bandId, _userId, tx) {
      options.onDeletePendingRequests?.(tx);
    },
  };
}

function createPrismaServiceStub(): PrismaService {
  const transactionClient = { transactionClient: true };

  return {
    async $transaction(callback: (tx: unknown) => Promise<unknown>) {
      return callback(transactionClient);
    },
  } as PrismaService;
}

function createFailingPrismaServiceStub(): PrismaService {
  return {
    async $transaction() {
      throw new Error('외부 tx가 있으면 새 transaction을 열지 않아야 합니다.');
    },
  } as unknown as PrismaService;
}

describe('BandInviteLinksService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createBandInviteLink', () => {
    it('BM이 7일 동안 유효한 초대 코드를 발급한다', async () => {
      jest.useFakeTimers().setSystemTime(NOW);
      let capturedInput: UpsertBandInviteLinkInput | undefined;
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({
        onFindAccessContext(tx) {
          capturedTransactions.push(tx);
        },
        onUpsertInviteLink(input, tx) {
          capturedInput = input;
          capturedTransactions.push(tx);
        },
      });
      const service = new BandInviteLinksService(repository, createPrismaServiceStub());

      const result = await service.createBandInviteLink(USER_ID, BAND_ID);

      expect(result.bandId).toBe(BAND_ID);
      expect(result.inviteCode).toMatch(/^[A-HJ-NP-Z2-9]{16}$/);
      expect(result.expiredAt).toBe('2026-08-04T00:00:00.000Z');
      expect(capturedInput).toEqual({
        bandId: BAND_ID,
        createBandMemberId: BAND_MEMBER_ID,
        codeHash: createHash('sha256').update(result.inviteCode).digest('hex'),
        expiredAt: new Date('2026-08-04T00:00:00.000Z'),
      });
      expect(capturedTransactions).toHaveLength(2);
      expect(capturedTransactions[0]).toBe(capturedTransactions[1]);
    });

    it('ADMIN도 초대 코드를 발급한다', async () => {
      const repository = createRepositoryStub({
        accessContext: {
          id: BAND_ID,
          member: {
            id: BAND_MEMBER_ID,
            role: BandMemberRole.ADMIN,
          },
        },
      });
      const service = new BandInviteLinksService(repository, createPrismaServiceStub());

      const result = await service.createBandInviteLink(USER_ID, BAND_ID);

      expect(result.bandId).toBe(BAND_ID);
    });

    it('밴드가 없으면 NotFoundException을 던진다', async () => {
      const repository = createRepositoryStub({ accessContext: null });
      const service = new BandInviteLinksService(repository, createPrismaServiceStub());

      await expect(service.createBandInviteLink(USER_ID, BAND_ID)).rejects.toThrow(NotFoundException);
    });

    it('일반 멤버면 ForbiddenException을 던진다', async () => {
      const repository = createRepositoryStub({
        accessContext: {
          id: BAND_ID,
          member: {
            id: BAND_MEMBER_ID,
            role: BandMemberRole.MEMBER,
          },
        },
      });
      const service = new BandInviteLinksService(repository, createPrismaServiceStub());

      await expect(service.createBandInviteLink(USER_ID, BAND_ID)).rejects.toThrow(ForbiddenException);
    });

    it('외부 transaction client를 그대로 전달한다', async () => {
      const externalTx = { transactionClient: true };
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({
        onFindAccessContext(tx) {
          capturedTransactions.push(tx);
        },
        onUpsertInviteLink(_input, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandInviteLinksService(repository, createFailingPrismaServiceStub());

      await service.createBandInviteLink(USER_ID, BAND_ID, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx, externalTx]);
    });
  });

  describe('revokeBandInviteLink', () => {
    it('BM이 현재 초대 링크를 폐기한다', async () => {
      jest.useFakeTimers().setSystemTime(NOW);
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({
        onFindAccessContext(tx) {
          capturedTransactions.push(tx);
        },
        onDeleteInviteLink(tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandInviteLinksService(repository, createPrismaServiceStub());

      const result = await service.revokeBandInviteLink(USER_ID, BAND_ID);

      expect(result).toEqual({
        bandId: BAND_ID,
        revokedAt: NOW.toISOString(),
      });
      expect(capturedTransactions).toHaveLength(2);
      expect(capturedTransactions[0]).toBe(capturedTransactions[1]);
    });

    it('폐기할 링크가 없으면 NotFoundException을 던진다', async () => {
      const repository = createRepositoryStub({ revoked: false });
      const service = new BandInviteLinksService(repository, createPrismaServiceStub());

      await expect(service.revokeBandInviteLink(USER_ID, BAND_ID)).rejects.toThrow(NotFoundException);
    });

    it('외부 transaction client를 그대로 전달한다', async () => {
      const externalTx = { transactionClient: true };
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({
        onFindAccessContext(tx) {
          capturedTransactions.push(tx);
        },
        onDeleteInviteLink(tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandInviteLinksService(repository, createFailingPrismaServiceStub());

      await service.revokeBandInviteLink(USER_ID, BAND_ID, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx, externalTx]);
    });
  });

  describe('joinBandByInviteLink', () => {
    it('유효한 코드를 정규화해 일반 멤버로 가입하고 대기 요청을 정리한다', async () => {
      const capturedTransactions: unknown[] = [];
      let capturedCodeHash: string | undefined;
      const repository = createRepositoryStub({
        onFindInviteLink(codeHash, tx) {
          capturedCodeHash = codeHash;
          capturedTransactions.push(tx);
        },
        onFindMember(tx) {
          capturedTransactions.push(tx);
        },
        onFindBlacklist(tx) {
          capturedTransactions.push(tx);
        },
        onCreateMember(tx) {
          capturedTransactions.push(tx);
        },
        onDeletePendingRequests(tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandInviteLinksService(repository, createPrismaServiceStub());

      const result = await service.joinBandByInviteLink(USER_ID, '  abcdef23456789gh  ');

      expect(capturedCodeHash).toBe(createHash('sha256').update('ABCDEF23456789GH').digest('hex'));
      expect(result).toEqual({
        bandId: BAND_ID,
        userId: USER_ID,
        memberId: BAND_MEMBER_ID,
        joinedAt: NOW.toISOString(),
      });
      expect(capturedTransactions).toHaveLength(5);
      expect(capturedTransactions.every(tx => tx === capturedTransactions[0])).toBe(true);
    });

    it('링크가 없으면 NotFoundException을 던진다', async () => {
      const repository = createRepositoryStub({ inviteLink: null });
      const service = new BandInviteLinksService(repository, createPrismaServiceStub());

      await expect(service.joinBandByInviteLink(USER_ID, 'ABCDEF23456789GH')).rejects.toThrow(NotFoundException);
    });

    it('링크가 만료됐으면 NotFoundException을 던진다', async () => {
      const repository = createRepositoryStub({
        inviteLink: {
          bandId: BAND_ID,
          expiredAt: new Date('2020-01-01T00:00:00.000Z'),
        },
      });
      const service = new BandInviteLinksService(repository, createPrismaServiceStub());

      await expect(service.joinBandByInviteLink(USER_ID, 'ABCDEF23456789GH')).rejects.toThrow(NotFoundException);
    });

    it('이미 밴드 멤버면 ConflictException을 던진다', async () => {
      const repository = createRepositoryStub({ existingMember: { id: BAND_MEMBER_ID } });
      const service = new BandInviteLinksService(repository, createPrismaServiceStub());

      await expect(service.joinBandByInviteLink(USER_ID, 'ABCDEF23456789GH')).rejects.toThrow(ConflictException);
    });

    it('차단된 사용자면 ForbiddenException을 던진다', async () => {
      const repository = createRepositoryStub({ blacklist: { id: 'blacklist-id' } });
      const service = new BandInviteLinksService(repository, createPrismaServiceStub());

      await expect(service.joinBandByInviteLink(USER_ID, 'ABCDEF23456789GH')).rejects.toThrow(ForbiddenException);
    });

    it('외부 transaction client를 그대로 전달한다', async () => {
      const externalTx = { transactionClient: true };
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({
        onFindInviteLink(_codeHash, tx) {
          capturedTransactions.push(tx);
        },
        onFindMember(tx) {
          capturedTransactions.push(tx);
        },
        onFindBlacklist(tx) {
          capturedTransactions.push(tx);
        },
        onCreateMember(tx) {
          capturedTransactions.push(tx);
        },
        onDeletePendingRequests(tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new BandInviteLinksService(repository, createFailingPrismaServiceStub());

      await service.joinBandByInviteLink(USER_ID, 'ABCDEF23456789GH', externalTx as never);

      expect(capturedTransactions).toEqual([externalTx, externalTx, externalTx, externalTx, externalTx]);
    });
  });
});
