import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';
import type { UserStatus } from 'src/generated/prisma';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import type { AdminAuditLogsRepository } from '../core/repositories/admin-audit-logs.repository';
import type { RecordAdminAuditLogInput } from '../core/types/admin-audit.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import type { AdminManagedUsersRepository } from './repositories/admin-managed-users.repository';
import type { AdminUserDetail, AdminUserListFilter, AdminUserListItem, AdminUserState } from './types/admin-user.type';
import { AdminUsersService } from './admin-users.service';

// ─── UUID 상수 ───────────────────────────────────────────────────
const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const BAND_ID = '33333333-3333-4333-8333-333333333333';

const ACTOR: AdminPrincipal = { id: ADMIN_ID, email: 'operator@bandco.kr', name: '운영자', role: 'OPERATOR' };

const ACTIVE_USER_STATE: AdminUserState = { userId: USER_ID, status: 'ACTIVE', deletedAt: null };
const DELETED_USER_STATE: AdminUserState = { userId: USER_ID, status: 'INACTIVE', deletedAt: new Date('2026-09-01T00:00:00.000Z') };

const LIST_ITEM: AdminUserListItem = {
  userId: USER_ID,
  email: 'user@bandco.kr',
  nickname: '기타리스트',
  avatarUrl: null,
  status: 'ACTIVE',
  isDeleted: false,
  isSuspended: false,
  providers: ['GOOGLE'],
  hasPassword: false,
  bandCount: 1,
  createdAt: '2026-08-01T00:00:00.000Z',
  lastLoginAt: null,
  deletedAt: null,
};

const USER_DETAIL: AdminUserDetail = {
  ...LIST_ITEM,
  selfDescription: null,
  oauthAccounts: [{ provider: 'GOOGLE', email: 'user@bandco.kr', createdAt: '2026-08-01T00:00:00.000Z' }],
  bands: [{ bandId: BAND_ID, name: '밴드코', role: 'MEMBER', joinedAt: '2026-08-02T00:00:00.000Z', isDeleted: false }],
  activeSuspension: null,
  reportCounts: { received: 0, made: 0 },
};

// ─── Repository Stub ─────────────────────────────────────────────
function createManagedUsersRepositoryStub(options?: {
  userState?: AdminUserState | null;
  userDetail?: AdminUserDetail | null;
  totalCount?: number;
  onCall?: (method: string, tx: unknown) => void;
  onFindUsers?: (filter: AdminUserListFilter, pagination: { page: number; size: number }) => void;
  onUpdateUserStatus?: (userId: string, status: UserStatus) => void;
  onSoftDeleteUser?: (userId: string, deletedAt: Date) => void;
  onRestoreUser?: (userId: string) => void;
}): AdminManagedUsersRepository {
  return {
    async findUsers(filter, pagination, _now, tx) {
      options?.onCall?.('findUsers', tx);
      options?.onFindUsers?.(filter, pagination);
      return { items: [LIST_ITEM], totalCount: options?.totalCount ?? 1 };
    },
    async findUserDetail(_userId, _now, tx) {
      options?.onCall?.('findUserDetail', tx);
      if (options?.userDetail !== undefined) return options.userDetail;
      return USER_DETAIL;
    },
    async findUserState(_userId, tx) {
      options?.onCall?.('findUserState', tx);
      if (options?.userState !== undefined) return options.userState;
      return ACTIVE_USER_STATE;
    },
    async updateUserStatus(userId, status, tx) {
      options?.onCall?.('updateUserStatus', tx);
      options?.onUpdateUserStatus?.(userId, status);
    },
    async softDeleteUser(userId, deletedAt, tx) {
      options?.onCall?.('softDeleteUser', tx);
      options?.onSoftDeleteUser?.(userId, deletedAt);
    },
    async restoreUser(userId, tx) {
      options?.onCall?.('restoreUser', tx);
      options?.onRestoreUser?.(userId);
    },
  };
}

type CapturedAuditLog = { input: RecordAdminAuditLogInput; tx: unknown };

function createAuditLogsServiceStub(capturedAuditLogs: CapturedAuditLog[] = []): AdminAuditLogsService {
  const repository: AdminAuditLogsRepository = {
    async create(input, tx) {
      capturedAuditLogs.push({ input, tx });
    },
    async findMany() {
      return { items: [], totalCount: 0 };
    },
  };
  return new AdminAuditLogsService(repository);
}

// ─── PrismaService Stub ──────────────────────────────────────────
const TRANSACTION_CLIENT = { transactionClient: true };

function createPrismaServiceStub(): PrismaService {
  return {
    async $transaction(callback: (tx: unknown) => Promise<unknown>) {
      return callback(TRANSACTION_CLIENT);
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

describe('AdminUsersService', () => {
  describe('getUsers', () => {
    it('필터와 페이지 정보를 저장소에 넘기고 페이지네이션 응답을 만든다', async () => {
      const capturedFilters: AdminUserListFilter[] = [];
      const repository = createManagedUsersRepositoryStub({
        totalCount: 21,
        onFindUsers(filter) {
          capturedFilters.push(filter);
        },
      });
      const service = new AdminUsersService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      const result = await service.getUsers({ keyword: 'user', status: 'SUSPENDED' }, { page: 1, size: 20 });

      expect(capturedFilters[0]).toEqual({ keyword: 'user', status: 'SUSPENDED' });
      expect(result).toEqual({ items: [LIST_ITEM], pagination: { page: 1, size: 20, totalCount: 21, hasNext: true } });
    });

    it('외부 transaction client를 저장소에 그대로 전달한다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const repository = createManagedUsersRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const service = new AdminUsersService(repository, createAuditLogsServiceStub(), createPrismaServiceFailingTransactionStub());

      await service.getUsers({}, { page: 1, size: 20 }, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx]);
    });
  });

  describe('getUserDetail', () => {
    it('회원 상세를 반환한다', async () => {
      const service = new AdminUsersService(createManagedUsersRepositoryStub(), createAuditLogsServiceStub(), createPrismaServiceStub());

      const result = await service.getUserDetail(USER_ID);

      expect(result).toEqual(USER_DETAIL);
    });

    it('회원이 없으면 NotFoundException을 던진다', async () => {
      const repository = createManagedUsersRepositoryStub({ userDetail: null });
      const service = new AdminUsersService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.getUserDetail(USER_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('외부 transaction client를 저장소에 그대로 전달한다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const repository = createManagedUsersRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const service = new AdminUsersService(repository, createAuditLogsServiceStub(), createPrismaServiceFailingTransactionStub());

      await service.getUserDetail(USER_ID, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx]);
    });
  });

  describe('updateUserStatus', () => {
    it('상태를 바꾸고 이전·이후 상태와 사유를 감사 로그에 같은 transaction으로 남긴다', async () => {
      const capturedStatuses: UserStatus[] = [];
      const capturedTransactions: unknown[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const repository = createManagedUsersRepositoryStub({
        onCall: (_method, tx) => capturedTransactions.push(tx),
        onUpdateUserStatus: (_userId, status) => capturedStatuses.push(status),
      });
      const service = new AdminUsersService(repository, createAuditLogsServiceStub(capturedAuditLogs), createPrismaServiceStub());

      const result = await service.updateUserStatus(ACTOR, USER_ID, { status: 'INACTIVE', reason: '장기 미사용' });

      expect(result).toEqual({ userId: USER_ID, status: 'INACTIVE' });
      expect(capturedStatuses).toEqual(['INACTIVE']);
      expect(capturedAuditLogs).toHaveLength(1);
      expect(capturedAuditLogs[0].input).toEqual({
        adminUserId: ADMIN_ID,
        action: 'USER_STATUS_UPDATE',
        targetType: 'USER',
        targetId: USER_ID,
        detail: { from: 'ACTIVE', to: 'INACTIVE', reason: '장기 미사용' },
      });
      expect(capturedTransactions).toEqual([TRANSACTION_CLIENT, TRANSACTION_CLIENT]);
      expect(capturedAuditLogs[0].tx).toBe(TRANSACTION_CLIENT);
    });

    it('회원이 없으면 NotFoundException을 던진다', async () => {
      const repository = createManagedUsersRepositoryStub({ userState: null });
      const service = new AdminUsersService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.updateUserStatus(ACTOR, USER_ID, { status: 'INACTIVE' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('탈퇴한 회원이면 BadRequestException을 던진다', async () => {
      const repository = createManagedUsersRepositoryStub({ userState: DELETED_USER_STATE });
      const service = new AdminUsersService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.updateUserStatus(ACTOR, USER_ID, { status: 'ACTIVE' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('이미 같은 상태면 BadRequestException을 던지고 아무것도 바꾸지 않는다', async () => {
      const capturedStatuses: UserStatus[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const repository = createManagedUsersRepositoryStub({ onUpdateUserStatus: (_userId, status) => capturedStatuses.push(status) });
      const service = new AdminUsersService(repository, createAuditLogsServiceStub(capturedAuditLogs), createPrismaServiceStub());

      await expect(service.updateUserStatus(ACTOR, USER_ID, { status: 'ACTIVE' })).rejects.toBeInstanceOf(BadRequestException);
      expect(capturedStatuses).toHaveLength(0);
      expect(capturedAuditLogs).toHaveLength(0);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const repository = createManagedUsersRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const service = new AdminUsersService(repository, createAuditLogsServiceStub(capturedAuditLogs), createPrismaServiceFailingTransactionStub());

      await service.updateUserStatus(ACTOR, USER_ID, { status: 'INACTIVE' }, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx, externalTx]);
      expect(capturedAuditLogs[0].tx).toBe(externalTx);
      expect(capturedAuditLogs[0].input.detail).toEqual({ from: 'ACTIVE', to: 'INACTIVE', reason: null });
    });
  });

  describe('withdrawUser', () => {
    it('탈퇴 시각을 기록하고 같은 transaction으로 USER_WITHDRAW 감사 로그를 남긴다', async () => {
      const capturedDeletedAts: Date[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const repository = createManagedUsersRepositoryStub({ onSoftDeleteUser: (_userId, deletedAt) => capturedDeletedAts.push(deletedAt) });
      const service = new AdminUsersService(repository, createAuditLogsServiceStub(capturedAuditLogs), createPrismaServiceStub());

      const result = await service.withdrawUser(ACTOR, USER_ID, '스팸 계정');

      expect(capturedDeletedAts).toHaveLength(1);
      expect(result).toEqual({ userId: USER_ID, deletedAt: capturedDeletedAts[0].toISOString() });
      expect(capturedAuditLogs[0].input).toEqual({
        adminUserId: ADMIN_ID,
        action: 'USER_WITHDRAW',
        targetType: 'USER',
        targetId: USER_ID,
        detail: { reason: '스팸 계정' },
      });
      expect(capturedAuditLogs[0].tx).toBe(TRANSACTION_CLIENT);
    });

    it('회원이 없으면 NotFoundException을 던진다', async () => {
      const repository = createManagedUsersRepositoryStub({ userState: null });
      const service = new AdminUsersService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.withdrawUser(ACTOR, USER_ID, undefined)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('이미 탈퇴한 회원이면 BadRequestException을 던진다', async () => {
      const repository = createManagedUsersRepositoryStub({ userState: DELETED_USER_STATE });
      const service = new AdminUsersService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.withdrawUser(ACTOR, USER_ID, undefined)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const repository = createManagedUsersRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const service = new AdminUsersService(repository, createAuditLogsServiceStub(capturedAuditLogs), createPrismaServiceFailingTransactionStub());

      await service.withdrawUser(ACTOR, USER_ID, undefined, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx, externalTx]);
      expect(capturedAuditLogs[0].tx).toBe(externalTx);
    });
  });

  describe('restoreUser', () => {
    it('탈퇴 회원을 복구하고 같은 transaction으로 USER_RESTORE 감사 로그를 남긴다', async () => {
      const capturedRestoredUserIds: string[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const repository = createManagedUsersRepositoryStub({
        userState: DELETED_USER_STATE,
        onRestoreUser: userId => capturedRestoredUserIds.push(userId),
      });
      const service = new AdminUsersService(repository, createAuditLogsServiceStub(capturedAuditLogs), createPrismaServiceStub());

      const result = await service.restoreUser(ACTOR, USER_ID);

      expect(result).toEqual({ userId: USER_ID, deletedAt: null });
      expect(capturedRestoredUserIds).toEqual([USER_ID]);
      expect(capturedAuditLogs[0].input).toEqual({ adminUserId: ADMIN_ID, action: 'USER_RESTORE', targetType: 'USER', targetId: USER_ID });
      expect(capturedAuditLogs[0].tx).toBe(TRANSACTION_CLIENT);
    });

    it('회원이 없으면 NotFoundException을 던진다', async () => {
      const repository = createManagedUsersRepositoryStub({ userState: null });
      const service = new AdminUsersService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.restoreUser(ACTOR, USER_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('탈퇴하지 않은 회원이면 BadRequestException을 던진다', async () => {
      const service = new AdminUsersService(createManagedUsersRepositoryStub(), createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.restoreUser(ACTOR, USER_ID)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const repository = createManagedUsersRepositoryStub({
        userState: DELETED_USER_STATE,
        onCall: (_method, tx) => capturedTransactions.push(tx),
      });
      const service = new AdminUsersService(repository, createAuditLogsServiceStub(capturedAuditLogs), createPrismaServiceFailingTransactionStub());

      await service.restoreUser(ACTOR, USER_ID, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx, externalTx]);
      expect(capturedAuditLogs[0].tx).toBe(externalTx);
    });
  });
});
