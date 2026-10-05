import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import type { AdminAuditLogsRepository } from '../core/repositories/admin-audit-logs.repository';
import type { RecordAdminAuditLogInput } from '../core/types/admin-audit.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import type { AdminManagedUsersRepository } from './repositories/admin-managed-users.repository';
import type { AdminUserNotificationsRepository } from './repositories/admin-user-notifications.repository';
import type { AdminUserSanctionsRepository } from './repositories/admin-user-sanctions.repository';
import type { CreateAdminNotificationInput } from './types/admin-notification.type';
import type { AdminSanctionRecord, CreateAdminSanctionRecordInput } from './types/admin-sanction.type';
import type { AdminUserState } from './types/admin-user.type';
import { AdminSanctionsService } from './admin-sanctions.service';

// ─── UUID 상수 ───────────────────────────────────────────────────
const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const SANCTION_ID = '77777777-7777-4777-8777-777777777777';
const OTHER_ADMIN_ID = '88888888-8888-4888-8888-888888888888';
const NOTIFICATION_ID = '99999999-9999-4999-8999-999999999999';

const ACTOR: AdminPrincipal = { id: ADMIN_ID, email: 'operator@bandco.kr', name: '운영자', role: 'OPERATOR' };

// 테스트 실행 시각과 무관하게 과거·미래가 확실한 시각
const PAST = new Date('2000-01-01T00:00:00.000Z');
const FUTURE = new Date('2999-01-01T00:00:00.000Z');
const CREATED_AT = new Date('2026-09-01T00:00:00.000Z');

const ACTIVE_USER_STATE: AdminUserState = { userId: USER_ID, status: 'ACTIVE', deletedAt: null };
const DELETED_USER_STATE: AdminUserState = { userId: USER_ID, status: 'INACTIVE', deletedAt: CREATED_AT };

const SUSPENSION_RECORD: AdminSanctionRecord = {
  sanctionId: SANCTION_ID,
  userId: USER_ID,
  type: 'SUSPENSION',
  reason: '욕설 반복',
  endsAt: FUTURE,
  createdAt: CREATED_AT,
  createdBy: { adminId: OTHER_ADMIN_ID, name: '다른 운영자' },
  revokedAt: null,
  revokedBy: null,
};

const WARNING_RECORD: AdminSanctionRecord = { ...SUSPENSION_RECORD, type: 'WARNING', reason: '도배', endsAt: null };

// ─── Repository Stub ─────────────────────────────────────────────
function createSanctionsRepositoryStub(options?: {
  records?: AdminSanctionRecord[];
  sanction?: AdminSanctionRecord | null;
  hasActiveSuspension?: boolean;
  onCall?: (method: string, tx: unknown) => void;
  onCreateSanction?: (input: CreateAdminSanctionRecordInput) => void;
  onRevokeSanction?: (sanctionId: string, revokedByAdminId: string, revokedAt: Date) => void;
}): AdminUserSanctionsRepository {
  return {
    async findSanctionsByUserId(_userId, tx) {
      options?.onCall?.('findSanctionsByUserId', tx);
      return options?.records ?? [SUSPENSION_RECORD];
    },
    async findSanctionById(_sanctionId, tx) {
      options?.onCall?.('findSanctionById', tx);
      if (options?.sanction !== undefined) return options.sanction;
      return SUSPENSION_RECORD;
    },
    async hasActiveSuspension(_userId, _now, tx) {
      options?.onCall?.('hasActiveSuspension', tx);
      return options?.hasActiveSuspension ?? false;
    },
    async createSanction(input, tx) {
      options?.onCall?.('createSanction', tx);
      options?.onCreateSanction?.(input);
      return {
        ...SUSPENSION_RECORD,
        type: input.type,
        reason: input.reason,
        endsAt: input.endsAt,
        createdBy: { adminId: input.createdByAdminId, name: '운영자' },
      };
    },
    async revokeSanction(sanctionId, revokedByAdminId, revokedAt, tx) {
      options?.onCall?.('revokeSanction', tx);
      options?.onRevokeSanction?.(sanctionId, revokedByAdminId, revokedAt);
      return { ...SUSPENSION_RECORD, revokedAt, revokedBy: { adminId: revokedByAdminId, name: '운영자' } };
    },
  };
}

/** 제재 서비스는 회원 존재 확인만 쓰므로 나머지 메서드는 호출되면 실패하게 둔다. */
function createManagedUsersRepositoryStub(options?: {
  userState?: AdminUserState | null;
  onCall?: (method: string, tx: unknown) => void;
}): AdminManagedUsersRepository {
  const unexpectedCall = async (): Promise<never> => {
    throw new Error('제재 서비스에서 호출되면 안 됩니다.');
  };
  return {
    async findUserState(_userId, tx) {
      options?.onCall?.('findUserState', tx);
      if (options?.userState !== undefined) return options.userState;
      return ACTIVE_USER_STATE;
    },
    findUsers: unexpectedCall,
    findUserDetail: unexpectedCall,
    updateUserStatus: unexpectedCall,
    softDeleteUser: unexpectedCall,
    restoreUser: unexpectedCall,
  };
}

/** 제재 서비스는 경고 알림 생성만 쓰므로 나머지 메서드는 호출되면 실패하게 둔다. */
function createNotificationsRepositoryStub(options?: {
  onCall?: (method: string, tx: unknown) => void;
  onCreateNotification?: (input: CreateAdminNotificationInput) => void;
}): AdminUserNotificationsRepository {
  const unexpectedCall = async (): Promise<never> => {
    throw new Error('제재 서비스에서 호출되면 안 됩니다.');
  };
  return {
    async createNotification(input, tx) {
      options?.onCall?.('createNotification', tx);
      options?.onCreateNotification?.(input);
      return NOTIFICATION_ID;
    },
    findNotificationsByUserId: unexpectedCall,
    findNotificationSource: unexpectedCall,
    createNoticeForActiveUsers: unexpectedCall,
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

function createService(options?: {
  sanctionsRepository?: AdminUserSanctionsRepository;
  managedUsersRepository?: AdminManagedUsersRepository;
  notificationsRepository?: AdminUserNotificationsRepository;
  capturedAuditLogs?: CapturedAuditLog[];
  prisma?: PrismaService;
}): AdminSanctionsService {
  return new AdminSanctionsService(
    options?.sanctionsRepository ?? createSanctionsRepositoryStub(),
    options?.managedUsersRepository ?? createManagedUsersRepositoryStub(),
    options?.notificationsRepository ?? createNotificationsRepositoryStub(),
    createAuditLogsServiceStub(options?.capturedAuditLogs),
    options?.prisma ?? createPrismaServiceStub(),
  );
}

describe('AdminSanctionsService', () => {
  describe('getUserSanctions', () => {
    it('제재 이력을 응답 형식으로 바꾸고 효력 여부를 계산한다', async () => {
      const expiredSuspension: AdminSanctionRecord = { ...SUSPENSION_RECORD, endsAt: PAST };
      const revokedSuspension: AdminSanctionRecord = {
        ...SUSPENSION_RECORD,
        endsAt: null,
        revokedAt: CREATED_AT,
        revokedBy: { adminId: ADMIN_ID, name: '운영자' },
      };
      const permanentSuspension: AdminSanctionRecord = { ...SUSPENSION_RECORD, endsAt: null };
      const service = createService({
        sanctionsRepository: createSanctionsRepositoryStub({
          records: [SUSPENSION_RECORD, expiredSuspension, revokedSuspension, permanentSuspension, WARNING_RECORD],
        }),
      });

      const result = await service.getUserSanctions(USER_ID);

      expect(result.sanctions.map(sanction => sanction.isActive)).toEqual([true, false, false, true, false]);
      expect(result.sanctions[0]).toEqual({
        sanctionId: SANCTION_ID,
        userId: USER_ID,
        type: 'SUSPENSION',
        reason: '욕설 반복',
        endsAt: FUTURE.toISOString(),
        isActive: true,
        createdAt: CREATED_AT.toISOString(),
        createdBy: { adminId: OTHER_ADMIN_ID, name: '다른 운영자' },
        revokedAt: null,
        revokedBy: null,
      });
      expect(result.sanctions[2].revokedAt).toBe(CREATED_AT.toISOString());
      expect(result.sanctions[2].revokedBy).toEqual({ adminId: ADMIN_ID, name: '운영자' });
    });

    it('탈퇴한 회원의 제재 이력도 조회할 수 있다', async () => {
      const service = createService({ managedUsersRepository: createManagedUsersRepositoryStub({ userState: DELETED_USER_STATE }) });

      const result = await service.getUserSanctions(USER_ID);

      expect(result.sanctions).toHaveLength(1);
    });

    it('회원이 없으면 NotFoundException을 던진다', async () => {
      const service = createService({ managedUsersRepository: createManagedUsersRepositoryStub({ userState: null }) });

      await expect(service.getUserSanctions(USER_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('외부 transaction client를 저장소에 그대로 전달한다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const onCall = (_method: string, tx: unknown) => capturedTransactions.push(tx);
      const service = createService({
        sanctionsRepository: createSanctionsRepositoryStub({ onCall }),
        managedUsersRepository: createManagedUsersRepositoryStub({ onCall }),
        prisma: createPrismaServiceFailingTransactionStub(),
      });

      await service.getUserSanctions(USER_ID, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx, externalTx]);
    });
  });

  describe('createSanction', () => {
    it('종료 시각이 있는 이용 정지를 만들고 같은 transaction으로 SANCTION_CREATE 감사 로그를 남긴다', async () => {
      const capturedInputs: CreateAdminSanctionRecordInput[] = [];
      const capturedNotifications: CreateAdminNotificationInput[] = [];
      const capturedTransactions: unknown[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const onCall = (_method: string, tx: unknown) => capturedTransactions.push(tx);
      const service = createService({
        sanctionsRepository: createSanctionsRepositoryStub({ onCall, onCreateSanction: input => capturedInputs.push(input) }),
        managedUsersRepository: createManagedUsersRepositoryStub({ onCall }),
        notificationsRepository: createNotificationsRepositoryStub({ onCreateNotification: input => capturedNotifications.push(input) }),
        capturedAuditLogs,
      });

      const result = await service.createSanction(ACTOR, USER_ID, { type: 'SUSPENSION', reason: '욕설 반복', endsAt: FUTURE.toISOString() });

      expect(capturedInputs).toEqual([{ userId: USER_ID, type: 'SUSPENSION', reason: '욕설 반복', endsAt: FUTURE, createdByAdminId: ADMIN_ID }]);
      expect(capturedNotifications).toHaveLength(0);
      expect(result.isActive).toBe(true);
      expect(result.endsAt).toBe(FUTURE.toISOString());
      expect(capturedAuditLogs[0].input).toEqual({
        adminUserId: ADMIN_ID,
        action: 'SANCTION_CREATE',
        targetType: 'USER',
        targetId: USER_ID,
        detail: { sanctionId: SANCTION_ID, type: 'SUSPENSION', endsAt: FUTURE.toISOString() },
      });
      expect(capturedTransactions).toEqual([TRANSACTION_CLIENT, TRANSACTION_CLIENT, TRANSACTION_CLIENT]);
      expect(capturedAuditLogs[0].tx).toBe(TRANSACTION_CLIENT);
    });

    it('종료 시각이 없으면 영구 정지로 만든다', async () => {
      const capturedInputs: CreateAdminSanctionRecordInput[] = [];
      const service = createService({
        sanctionsRepository: createSanctionsRepositoryStub({ onCreateSanction: input => capturedInputs.push(input) }),
      });

      const result = await service.createSanction(ACTOR, USER_ID, { type: 'SUSPENSION', reason: '사기', endsAt: null });

      expect(capturedInputs[0].endsAt).toBeNull();
      expect(result.endsAt).toBeNull();
      expect(result.isActive).toBe(true);
    });

    it('경고는 회원에게 NOTICE 알림을 같은 transaction으로 함께 보내고 활성 정지 여부는 확인하지 않는다', async () => {
      const capturedNotifications: CreateAdminNotificationInput[] = [];
      const capturedTransactions: unknown[] = [];
      const capturedMethods: string[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const onCall = (method: string, tx: unknown) => {
        capturedMethods.push(method);
        capturedTransactions.push(tx);
      };
      const service = createService({
        sanctionsRepository: createSanctionsRepositoryStub({ onCall, hasActiveSuspension: true }),
        managedUsersRepository: createManagedUsersRepositoryStub({ onCall }),
        notificationsRepository: createNotificationsRepositoryStub({ onCall, onCreateNotification: input => capturedNotifications.push(input) }),
        capturedAuditLogs,
      });

      const result = await service.createSanction(ACTOR, USER_ID, { type: 'WARNING', reason: '도배' });

      expect(result.type).toBe('WARNING');
      expect(result.isActive).toBe(false);
      expect(capturedMethods).not.toContain('hasActiveSuspension');
      expect(capturedNotifications).toEqual([
        {
          userId: USER_ID,
          type: 'NOTICE',
          title: '운영 정책 위반 경고',
          description: '도배',
          targetPath: null,
          referenceType: null,
          referenceId: null,
        },
      ]);
      expect(capturedAuditLogs[0].input.detail).toEqual({ sanctionId: SANCTION_ID, type: 'WARNING', endsAt: null });
      expect(capturedTransactions.every(tx => tx === TRANSACTION_CLIENT)).toBe(true);
    });

    it('경고에 종료 시각을 주면 BadRequestException을 던진다', async () => {
      const service = createService();

      await expect(service.createSanction(ACTOR, USER_ID, { type: 'WARNING', reason: '도배', endsAt: FUTURE.toISOString() })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('정지 종료 시각이 지났으면 BadRequestException을 던진다', async () => {
      const service = createService();

      await expect(service.createSanction(ACTOR, USER_ID, { type: 'SUSPENSION', reason: '욕설', endsAt: PAST.toISOString() })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('회원이 없으면 NotFoundException을 던진다', async () => {
      const service = createService({ managedUsersRepository: createManagedUsersRepositoryStub({ userState: null }) });

      await expect(service.createSanction(ACTOR, USER_ID, { type: 'SUSPENSION', reason: '욕설' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('탈퇴한 회원이면 NotFoundException을 던진다', async () => {
      const service = createService({ managedUsersRepository: createManagedUsersRepositoryStub({ userState: DELETED_USER_STATE }) });

      await expect(service.createSanction(ACTOR, USER_ID, { type: 'WARNING', reason: '도배' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('이미 활성 정지가 있으면 ConflictException을 던지고 제재를 만들지 않는다', async () => {
      const capturedInputs: CreateAdminSanctionRecordInput[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const service = createService({
        sanctionsRepository: createSanctionsRepositoryStub({ hasActiveSuspension: true, onCreateSanction: input => capturedInputs.push(input) }),
        capturedAuditLogs,
      });

      await expect(service.createSanction(ACTOR, USER_ID, { type: 'SUSPENSION', reason: '욕설' })).rejects.toBeInstanceOf(ConflictException);
      expect(capturedInputs).toHaveLength(0);
      expect(capturedAuditLogs).toHaveLength(0);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const onCall = (_method: string, tx: unknown) => capturedTransactions.push(tx);
      const service = createService({
        sanctionsRepository: createSanctionsRepositoryStub({ onCall }),
        managedUsersRepository: createManagedUsersRepositoryStub({ onCall }),
        notificationsRepository: createNotificationsRepositoryStub({ onCall }),
        capturedAuditLogs,
        prisma: createPrismaServiceFailingTransactionStub(),
      });

      await service.createSanction(ACTOR, USER_ID, { type: 'WARNING', reason: '도배' }, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx, externalTx, externalTx]);
      expect(capturedAuditLogs[0].tx).toBe(externalTx);
    });
  });

  describe('revokeSanction', () => {
    it('이용 정지를 철회하고 같은 transaction으로 SANCTION_REVOKE 감사 로그를 남긴다', async () => {
      const capturedRevokes: { sanctionId: string; revokedByAdminId: string }[] = [];
      const capturedTransactions: unknown[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const service = createService({
        sanctionsRepository: createSanctionsRepositoryStub({
          onCall: (_method, tx) => capturedTransactions.push(tx),
          onRevokeSanction: (sanctionId, revokedByAdminId) => capturedRevokes.push({ sanctionId, revokedByAdminId }),
        }),
        capturedAuditLogs,
      });

      const result = await service.revokeSanction(ACTOR, SANCTION_ID);

      expect(capturedRevokes).toEqual([{ sanctionId: SANCTION_ID, revokedByAdminId: ADMIN_ID }]);
      expect(result.isActive).toBe(false);
      expect(result.revokedBy).toEqual({ adminId: ADMIN_ID, name: '운영자' });
      expect(result.revokedAt).not.toBeNull();
      expect(capturedAuditLogs[0].input).toEqual({
        adminUserId: ADMIN_ID,
        action: 'SANCTION_REVOKE',
        targetType: 'SANCTION',
        targetId: SANCTION_ID,
        detail: { userId: USER_ID },
      });
      expect(capturedTransactions).toEqual([TRANSACTION_CLIENT, TRANSACTION_CLIENT]);
      expect(capturedAuditLogs[0].tx).toBe(TRANSACTION_CLIENT);
    });

    it('제재가 없으면 NotFoundException을 던진다', async () => {
      const service = createService({ sanctionsRepository: createSanctionsRepositoryStub({ sanction: null }) });

      await expect(service.revokeSanction(ACTOR, SANCTION_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('경고는 BadRequestException을 던진다', async () => {
      const service = createService({ sanctionsRepository: createSanctionsRepositoryStub({ sanction: WARNING_RECORD }) });

      await expect(service.revokeSanction(ACTOR, SANCTION_ID)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('이미 철회된 제재면 BadRequestException을 던지고 다시 철회하지 않는다', async () => {
      const capturedRevokes: string[] = [];
      const revokedSuspension: AdminSanctionRecord = {
        ...SUSPENSION_RECORD,
        revokedAt: CREATED_AT,
        revokedBy: { adminId: ADMIN_ID, name: '운영자' },
      };
      const service = createService({
        sanctionsRepository: createSanctionsRepositoryStub({
          sanction: revokedSuspension,
          onRevokeSanction: sanctionId => capturedRevokes.push(sanctionId),
        }),
      });

      await expect(service.revokeSanction(ACTOR, SANCTION_ID)).rejects.toBeInstanceOf(BadRequestException);
      expect(capturedRevokes).toHaveLength(0);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const service = createService({
        sanctionsRepository: createSanctionsRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) }),
        capturedAuditLogs,
        prisma: createPrismaServiceFailingTransactionStub(),
      });

      await service.revokeSanction(ACTOR, SANCTION_ID, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx, externalTx]);
      expect(capturedAuditLogs[0].tx).toBe(externalTx);
    });
  });
});
