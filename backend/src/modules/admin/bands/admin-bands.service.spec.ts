import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';
import type { BandMemberRole } from 'src/generated/prisma';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import type { AdminAuditLogsRepository } from '../core/repositories/admin-audit-logs.repository';
import type { RecordAdminAuditLogInput } from '../core/types/admin-audit.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import type { AdminBandsRepository } from './repositories/admin-bands.repository';
import type { AdminBandDetailRecord, AdminBandListFilter, AdminBandMembership, AdminBandState } from './types/admin-band.type';
import { AdminBandsService } from './admin-bands.service';

// ─── UUID 상수 ───────────────────────────────────────────────────
const ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BAND_ID = '22222222-2222-4222-8222-222222222222';
const MASTER_USER_ID = '11111111-1111-4111-8111-111111111111';
const TARGET_USER_ID = '33333333-3333-4333-8333-333333333333';
const MASTER_MEMBER_ID = '44444444-4444-4444-8444-444444444444';
const TARGET_MEMBER_ID = '55555555-5555-4555-8555-555555555555';

const ADMIN: AdminPrincipal = { id: ADMIN_ID, email: 'operator@bandco.kr', name: '운영자', role: 'OPERATOR' };

const ACTIVE_BAND: AdminBandState = { id: BAND_ID, bandMasterUserId: MASTER_USER_ID, deletedAt: null };
const DELETED_BAND: AdminBandState = { id: BAND_ID, bandMasterUserId: MASTER_USER_ID, deletedAt: new Date('2026-10-01T00:00:00.000Z') };

const MEMBERSHIPS: Record<string, AdminBandMembership> = {
  [MASTER_USER_ID]: { id: MASTER_MEMBER_ID, userId: MASTER_USER_ID, role: 'BM', isUserDeleted: false },
  [TARGET_USER_ID]: { id: TARGET_MEMBER_ID, userId: TARGET_USER_ID, role: 'MEMBER', isUserDeleted: false },
};

const FUTURE = new Date(Date.now() + 24 * 60 * 60 * 1000);
const PAST = new Date('2020-01-01T00:00:00.000Z');

const DETAIL_RECORD: AdminBandDetailRecord = {
  bandId: BAND_ID,
  name: '락밴드',
  description: null,
  visibility: true,
  coverImgUrl: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
  deletedAt: null,
  genres: [],
  bandMaster: { userId: MASTER_USER_ID, nickname: '밴드장', email: 'bm@bandco.kr' },
  members: [],
  bandSpaces: [],
  pendingJoinRequests: [],
  pendingInvitations: [],
  inviteLinkExpiredAt: null,
  counts: { songs: 1, schedules: 2, teams: 3, places: 4 },
};

// ─── Repository Stub ─────────────────────────────────────────────
function createAdminBandsRepositoryStub(options?: {
  band?: AdminBandState | null;
  detail?: AdminBandDetailRecord | null;
  memberships?: Record<string, AdminBandMembership>;
  inviteLink?: { expiredAt: Date | null } | null;
  onFindBands?: (filter: AdminBandListFilter) => void;
  onAnyCall?: (tx: unknown) => void;
  onUpdateBandMemberRole?: (bandMemberId: string, role: BandMemberRole) => void;
  onUpdateBandMaster?: (bandId: string, userId: string) => void;
  onUpdateBandInviteLinkExpiredAt?: (expiredAt: Date) => void;
  onUpdateBandDeletedAt?: (deletedAt: Date | null) => void;
}): AdminBandsRepository {
  const memberships = options?.memberships ?? MEMBERSHIPS;

  return {
    async findBands(filter, _pagination, tx) {
      options?.onFindBands?.(filter);
      options?.onAnyCall?.(tx);
      return { items: [], totalCount: 45 };
    },
    async findBandDetail(_bandId, tx) {
      options?.onAnyCall?.(tx);
      if (options?.detail !== undefined) return options.detail;
      return DETAIL_RECORD;
    },
    async findBandState(_bandId, tx) {
      options?.onAnyCall?.(tx);
      if (options?.band !== undefined) return options.band;
      return ACTIVE_BAND;
    },
    async findBandMembership(_bandId, userId, tx) {
      options?.onAnyCall?.(tx);
      return memberships[userId] ?? null;
    },
    async updateBandMemberRole(bandMemberId, role, tx) {
      options?.onAnyCall?.(tx);
      options?.onUpdateBandMemberRole?.(bandMemberId, role);
    },
    async updateBandMaster(bandId, userId, tx) {
      options?.onAnyCall?.(tx);
      options?.onUpdateBandMaster?.(bandId, userId);
    },
    async findBandInviteLink(_bandId, tx) {
      options?.onAnyCall?.(tx);
      if (options?.inviteLink !== undefined) return options.inviteLink;
      return { expiredAt: FUTURE };
    },
    async updateBandInviteLinkExpiredAt(_bandId, expiredAt, tx) {
      options?.onAnyCall?.(tx);
      options?.onUpdateBandInviteLinkExpiredAt?.(expiredAt);
    },
    async updateBandDeletedAt(_bandId, deletedAt, tx) {
      options?.onAnyCall?.(tx);
      options?.onUpdateBandDeletedAt?.(deletedAt);
    },
  };
}

function createAuditLogsServiceStub(onRecord?: (input: RecordAdminAuditLogInput, tx: unknown) => void): AdminAuditLogsService {
  const repository: AdminAuditLogsRepository = {
    async create(input, tx) {
      onRecord?.(input, tx);
    },
    async findMany() {
      return { items: [], totalCount: 0 };
    },
  };
  return new AdminAuditLogsService(repository);
}

// ─── PrismaService Stub ──────────────────────────────────────────
function createPrismaServiceStub(): PrismaService {
  const tx = { transactionClient: true };
  return {
    async $transaction(callback: (client: unknown) => Promise<unknown>) {
      return callback(tx);
    },
  } as unknown as PrismaService;
}

function createPrismaServiceFailingTransactionStub(): PrismaService {
  return {
    async $transaction() {
      throw new Error('외부 tx가 있으면 새 transaction을 열지 않아야 합니다.');
    },
  } as unknown as PrismaService;
}

describe('AdminBandsService', () => {
  describe('getBands', () => {
    it('필터를 그대로 넘기고 페이지네이션 응답을 만든다', async () => {
      let capturedFilter: AdminBandListFilter | undefined;
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({
          onFindBands(filter) {
            capturedFilter = filter;
          },
        }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      const result = await service.getBands({ keyword: '락', includeDeleted: true }, { page: 2, size: 20 });

      expect(capturedFilter).toEqual({ keyword: '락', includeDeleted: true });
      expect(result.pagination).toEqual({ page: 2, size: 20, totalCount: 45, hasNext: true });
    });
  });

  describe('getBand', () => {
    it('만료 시각이 미래인 초대 링크는 활성으로 보여준다', async () => {
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({ detail: { ...DETAIL_RECORD, inviteLinkExpiredAt: FUTURE } }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      const result = await service.getBand(BAND_ID);

      expect(result.inviteLink).toEqual({ hasActiveLink: true, expiredAt: FUTURE.toISOString() });
      expect(result.counts).toEqual({ songs: 1, schedules: 2, teams: 3, places: 4 });
      expect(result).not.toHaveProperty('inviteLinkExpiredAt');
    });

    it('만료됐거나 없는 초대 링크는 비활성으로 보여준다', async () => {
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({ detail: { ...DETAIL_RECORD, inviteLinkExpiredAt: PAST } }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      const result = await service.getBand(BAND_ID);

      expect(result.inviteLink).toEqual({ hasActiveLink: false, expiredAt: null });
    });

    it('삭제된 밴드도 상세를 조회할 수 있다', async () => {
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({ detail: { ...DETAIL_RECORD, deletedAt: '2026-10-01T00:00:00.000Z' } }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      const result = await service.getBand(BAND_ID);

      expect(result.deletedAt).toBe('2026-10-01T00:00:00.000Z');
    });

    it('밴드가 없으면 NotFoundException을 던진다', async () => {
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({ detail: null }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.getBand(BAND_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('transferBandMaster', () => {
    it('대상 회원이 탈퇴했으면 BadRequestException을 던지고 역할을 바꾸지 않는다', async () => {
      const capturedRoles: { bandMemberId: string; role: BandMemberRole }[] = [];
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({
          memberships: { ...MEMBERSHIPS, [TARGET_USER_ID]: { ...MEMBERSHIPS[TARGET_USER_ID], isUserDeleted: true } },
          onUpdateBandMemberRole(bandMemberId, role) {
            capturedRoles.push({ bandMemberId, role });
          },
        }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.transferBandMaster(ADMIN, BAND_ID, TARGET_USER_ID)).rejects.toThrow('탈퇴한 회원에게는 밴드장을 넘길 수 없습니다.');
      expect(capturedRoles).toHaveLength(0);
    });

    it('대상은 BM, 기존 밴드장은 ADMIN으로 바꾸고 밴드장을 교체한다', async () => {
      const capturedRoles: { bandMemberId: string; role: BandMemberRole }[] = [];
      let capturedBandMaster: { bandId: string; userId: string } | undefined;
      const capturedAudits: RecordAdminAuditLogInput[] = [];
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({
          onUpdateBandMemberRole(bandMemberId, role) {
            capturedRoles.push({ bandMemberId, role });
          },
          onUpdateBandMaster(bandId, userId) {
            capturedBandMaster = { bandId, userId };
          },
        }),
        createAuditLogsServiceStub(input => capturedAudits.push(input)),
        createPrismaServiceStub(),
      );

      const result = await service.transferBandMaster(ADMIN, BAND_ID, TARGET_USER_ID);

      expect(result).toEqual({ bandId: BAND_ID, bandMasterUserId: TARGET_USER_ID, previousBandMasterUserId: MASTER_USER_ID });
      expect(capturedRoles).toEqual(
        expect.arrayContaining([
          { bandMemberId: MASTER_MEMBER_ID, role: 'ADMIN' },
          { bandMemberId: TARGET_MEMBER_ID, role: 'BM' },
        ]),
      );
      expect(capturedRoles).toHaveLength(2);
      expect(capturedBandMaster).toEqual({ bandId: BAND_ID, userId: TARGET_USER_ID });
      expect(capturedAudits).toEqual([
        {
          adminUserId: ADMIN_ID,
          action: 'BAND_MASTER_TRANSFER',
          targetType: 'BAND',
          targetId: BAND_ID,
          detail: { from: MASTER_USER_ID, to: TARGET_USER_ID },
        },
      ]);
    });

    it('기존 밴드장이 멤버가 아니면 대상 역할만 바꾼다', async () => {
      const capturedRoles: { bandMemberId: string; role: BandMemberRole }[] = [];
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({
          memberships: { [TARGET_USER_ID]: MEMBERSHIPS[TARGET_USER_ID] },
          onUpdateBandMemberRole(bandMemberId, role) {
            capturedRoles.push({ bandMemberId, role });
          },
        }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await service.transferBandMaster(ADMIN, BAND_ID, TARGET_USER_ID);

      expect(capturedRoles).toEqual([{ bandMemberId: TARGET_MEMBER_ID, role: 'BM' }]);
    });

    it('밴드가 없으면 NotFoundException을 던진다', async () => {
      const service = new AdminBandsService(createAdminBandsRepositoryStub({ band: null }), createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.transferBandMaster(ADMIN, BAND_ID, TARGET_USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('삭제된 밴드면 NotFoundException을 던진다', async () => {
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({ band: DELETED_BAND }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.transferBandMaster(ADMIN, BAND_ID, TARGET_USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('대상이 밴드 멤버가 아니면 BadRequestException을 던진다', async () => {
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({ memberships: { [MASTER_USER_ID]: MEMBERSHIPS[MASTER_USER_ID] } }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.transferBandMaster(ADMIN, BAND_ID, TARGET_USER_ID)).rejects.toThrow(BadRequestException);
    });

    it('대상이 이미 밴드장이면 BadRequestException을 던진다', async () => {
      const service = new AdminBandsService(createAdminBandsRepositoryStub(), createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.transferBandMaster(ADMIN, BAND_ID, MASTER_USER_ID)).rejects.toThrow(BadRequestException);
    });

    it('조회·변경·감사 로그를 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({ onAnyCall: tx => capturedTransactions.push(tx) }),
        createAuditLogsServiceStub((_input, tx) => capturedTransactions.push(tx)),
        createPrismaServiceStub(),
      );

      await service.transferBandMaster(ADMIN, BAND_ID, TARGET_USER_ID);

      expect(capturedTransactions.length).toBeGreaterThan(1);
      expect(new Set(capturedTransactions).size).toBe(1);
      expect(capturedTransactions[0]).toEqual({ transactionClient: true });
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({ onAnyCall: tx => capturedTransactions.push(tx) }),
        createAuditLogsServiceStub((_input, tx) => capturedTransactions.push(tx)),
        createPrismaServiceFailingTransactionStub(),
      );

      await service.transferBandMaster(ADMIN, BAND_ID, TARGET_USER_ID, externalTx as never);

      expect(capturedTransactions.every(tx => tx === externalTx)).toBe(true);
    });
  });

  describe('expireBandInviteLink', () => {
    it('활성 링크의 만료 시각을 지금으로 바꾸고 감사 로그를 남긴다', async () => {
      let capturedExpiredAt: Date | undefined;
      const capturedAudits: RecordAdminAuditLogInput[] = [];
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({
          onUpdateBandInviteLinkExpiredAt(expiredAt) {
            capturedExpiredAt = expiredAt;
          },
        }),
        createAuditLogsServiceStub(input => capturedAudits.push(input)),
        createPrismaServiceStub(),
      );

      const before = Date.now();
      const result = await service.expireBandInviteLink(ADMIN, BAND_ID);

      expect(capturedExpiredAt).toBeInstanceOf(Date);
      expect(capturedExpiredAt!.getTime()).toBeGreaterThanOrEqual(before);
      expect(result).toEqual({ bandId: BAND_ID, expiredAt: capturedExpiredAt!.toISOString() });
      expect(capturedAudits).toEqual([{ adminUserId: ADMIN_ID, action: 'BAND_INVITE_LINK_EXPIRE', targetType: 'BAND', targetId: BAND_ID }]);
    });

    it('초대 링크가 없으면 BadRequestException을 던진다', async () => {
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({ inviteLink: null }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.expireBandInviteLink(ADMIN, BAND_ID)).rejects.toThrow(BadRequestException);
    });

    it('이미 만료된 링크면 BadRequestException을 던진다', async () => {
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({ inviteLink: { expiredAt: PAST } }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.expireBandInviteLink(ADMIN, BAND_ID)).rejects.toThrow(BadRequestException);
    });

    it('만료 시각이 없는 링크면 BadRequestException을 던진다', async () => {
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({ inviteLink: { expiredAt: null } }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.expireBandInviteLink(ADMIN, BAND_ID)).rejects.toThrow(BadRequestException);
    });

    it('삭제된 밴드면 NotFoundException을 던진다', async () => {
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({ band: DELETED_BAND }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.expireBandInviteLink(ADMIN, BAND_ID)).rejects.toThrow(NotFoundException);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({ onAnyCall: tx => capturedTransactions.push(tx) }),
        createAuditLogsServiceStub((_input, tx) => capturedTransactions.push(tx)),
        createPrismaServiceFailingTransactionStub(),
      );

      await service.expireBandInviteLink(ADMIN, BAND_ID, externalTx as never);

      expect(capturedTransactions.length).toBeGreaterThan(1);
      expect(capturedTransactions.every(tx => tx === externalTx)).toBe(true);
    });
  });

  describe('deleteBand', () => {
    it('deletedAt을 채우고 감사 로그를 같은 transaction에서 남긴다', async () => {
      let capturedDeletedAt: Date | null | undefined;
      const capturedTransactions: unknown[] = [];
      const capturedAudits: RecordAdminAuditLogInput[] = [];
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({
          onAnyCall: tx => capturedTransactions.push(tx),
          onUpdateBandDeletedAt(deletedAt) {
            capturedDeletedAt = deletedAt;
          },
        }),
        createAuditLogsServiceStub((input, tx) => {
          capturedAudits.push(input);
          capturedTransactions.push(tx);
        }),
        createPrismaServiceStub(),
      );

      const result = await service.deleteBand(ADMIN, BAND_ID);

      expect(capturedDeletedAt).toBeInstanceOf(Date);
      expect(result).toEqual({ bandId: BAND_ID, deletedAt: (capturedDeletedAt as Date).toISOString() });
      expect(capturedAudits).toEqual([{ adminUserId: ADMIN_ID, action: 'BAND_DELETE', targetType: 'BAND', targetId: BAND_ID }]);
      expect(new Set(capturedTransactions).size).toBe(1);
    });

    it('밴드가 없으면 NotFoundException을 던진다', async () => {
      const service = new AdminBandsService(createAdminBandsRepositoryStub({ band: null }), createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.deleteBand(ADMIN, BAND_ID)).rejects.toThrow(NotFoundException);
    });

    it('이미 삭제된 밴드면 BadRequestException을 던진다', async () => {
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({ band: DELETED_BAND }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.deleteBand(ADMIN, BAND_ID)).rejects.toThrow(BadRequestException);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({ onAnyCall: tx => capturedTransactions.push(tx) }),
        createAuditLogsServiceStub((_input, tx) => capturedTransactions.push(tx)),
        createPrismaServiceFailingTransactionStub(),
      );

      await service.deleteBand(ADMIN, BAND_ID, externalTx as never);

      expect(capturedTransactions.length).toBeGreaterThan(1);
      expect(capturedTransactions.every(tx => tx === externalTx)).toBe(true);
    });
  });

  describe('restoreBand', () => {
    it('deletedAt을 비우고 감사 로그를 같은 transaction에서 남긴다', async () => {
      let capturedDeletedAt: Date | null | undefined;
      const capturedTransactions: unknown[] = [];
      const capturedAudits: RecordAdminAuditLogInput[] = [];
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({
          band: DELETED_BAND,
          onAnyCall: tx => capturedTransactions.push(tx),
          onUpdateBandDeletedAt(deletedAt) {
            capturedDeletedAt = deletedAt;
          },
        }),
        createAuditLogsServiceStub((input, tx) => {
          capturedAudits.push(input);
          capturedTransactions.push(tx);
        }),
        createPrismaServiceStub(),
      );

      const result = await service.restoreBand(ADMIN, BAND_ID);

      expect(capturedDeletedAt).toBeNull();
      expect(result).toEqual({ bandId: BAND_ID, deletedAt: null });
      expect(capturedAudits).toEqual([{ adminUserId: ADMIN_ID, action: 'BAND_RESTORE', targetType: 'BAND', targetId: BAND_ID }]);
      expect(new Set(capturedTransactions).size).toBe(1);
    });

    it('밴드가 없으면 NotFoundException을 던진다', async () => {
      const service = new AdminBandsService(createAdminBandsRepositoryStub({ band: null }), createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.restoreBand(ADMIN, BAND_ID)).rejects.toThrow(NotFoundException);
    });

    it('삭제되지 않은 밴드면 BadRequestException을 던진다', async () => {
      const service = new AdminBandsService(createAdminBandsRepositoryStub(), createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.restoreBand(ADMIN, BAND_ID)).rejects.toThrow(BadRequestException);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const service = new AdminBandsService(
        createAdminBandsRepositoryStub({ band: DELETED_BAND, onAnyCall: tx => capturedTransactions.push(tx) }),
        createAuditLogsServiceStub((_input, tx) => capturedTransactions.push(tx)),
        createPrismaServiceFailingTransactionStub(),
      );

      await service.restoreBand(ADMIN, BAND_ID, externalTx as never);

      expect(capturedTransactions.length).toBeGreaterThan(1);
      expect(capturedTransactions.every(tx => tx === externalTx)).toBe(true);
    });
  });
});
