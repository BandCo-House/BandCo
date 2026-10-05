import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import type { AdminAuditLogsRepository } from '../core/repositories/admin-audit-logs.repository';
import type { RecordAdminAuditLogInput } from '../core/types/admin-audit.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import type { AdminManagedUsersRepository } from './repositories/admin-managed-users.repository';
import type { AdminUserNotificationsRepository } from './repositories/admin-user-notifications.repository';
import type { AdminNoticeContent, AdminNotification, AdminNotificationSource, CreateAdminNotificationInput } from './types/admin-notification.type';
import type { AdminUserState } from './types/admin-user.type';
import { AdminNotificationsService } from './admin-notifications.service';

// ─── UUID 상수 ───────────────────────────────────────────────────
const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const NOTIFICATION_ID = '44444444-4444-4444-8444-444444444444';
const NEW_NOTIFICATION_ID = '55555555-5555-4555-8555-555555555555';
const REFERENCE_ID = '66666666-6666-4666-8666-666666666666';

const ACTOR: AdminPrincipal = { id: ADMIN_ID, email: 'super@bandco.kr', name: '최고관리자', role: 'SUPER_ADMIN' };

const ACTIVE_USER_STATE: AdminUserState = { userId: USER_ID, status: 'ACTIVE', deletedAt: null };
const DELETED_USER_STATE: AdminUserState = { userId: USER_ID, status: 'INACTIVE', deletedAt: new Date('2026-09-01T00:00:00.000Z') };

const NOTIFICATION_ITEM: AdminNotification = {
  notificationId: NOTIFICATION_ID,
  type: 'INVITE',
  title: '밴드 초대',
  description: '초대가 도착했습니다.',
  targetPath: '/invites',
  isRead: true,
  createdAt: '2026-09-01T00:00:00.000Z',
};

const NOTIFICATION_CONTENT: CreateAdminNotificationInput = {
  userId: USER_ID,
  type: 'NOTICE',
  title: '점검 안내',
  description: '오늘 밤 점검합니다.',
  targetPath: '/notices',
  referenceType: null,
  referenceId: REFERENCE_ID,
};

const NOTIFICATION_SOURCE: AdminNotificationSource = { ...NOTIFICATION_CONTENT, isRecipientDeleted: false };

const NOTICE_CONTENT: AdminNoticeContent = { title: '서비스 점검 안내', description: '오늘 밤 점검합니다.', targetPath: '/notices' };

// ─── Repository Stub ─────────────────────────────────────────────
function createNotificationsRepositoryStub(options?: {
  source?: AdminNotificationSource | null;
  broadcastCount?: number;
  totalCount?: number;
  onCall?: (method: string, tx: unknown) => void;
  onCreateNotification?: (input: CreateAdminNotificationInput) => void;
  onCreateNoticeForActiveUsers?: (content: AdminNoticeContent) => void;
}): AdminUserNotificationsRepository {
  return {
    async findNotificationsByUserId(_userId, _pagination, tx) {
      options?.onCall?.('findNotificationsByUserId', tx);
      return { items: [NOTIFICATION_ITEM], totalCount: options?.totalCount ?? 1 };
    },
    async findNotificationSource(_notificationId, tx) {
      options?.onCall?.('findNotificationSource', tx);
      if (options?.source !== undefined) return options.source;
      return NOTIFICATION_SOURCE;
    },
    async createNotification(input, tx) {
      options?.onCall?.('createNotification', tx);
      options?.onCreateNotification?.(input);
      return NEW_NOTIFICATION_ID;
    },
    async createNoticeForActiveUsers(content, tx) {
      options?.onCall?.('createNoticeForActiveUsers', tx);
      options?.onCreateNoticeForActiveUsers?.(content);
      return options?.broadcastCount ?? 3;
    },
  };
}

/** 알림 서비스는 회원 존재 확인만 쓰므로 나머지 메서드는 호출되면 실패하게 둔다. */
function createManagedUsersRepositoryStub(options?: {
  userState?: AdminUserState | null;
  onCall?: (method: string, tx: unknown) => void;
}): AdminManagedUsersRepository {
  const unexpectedCall = async (): Promise<never> => {
    throw new Error('알림 서비스에서 호출되면 안 됩니다.');
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

describe('AdminNotificationsService', () => {
  describe('getUserNotifications', () => {
    it('회원 알림을 페이지네이션 응답으로 반환한다', async () => {
      const service = new AdminNotificationsService(
        createNotificationsRepositoryStub({ totalCount: 41 }),
        createManagedUsersRepositoryStub(),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      const result = await service.getUserNotifications(USER_ID, { page: 2, size: 20 });

      expect(result).toEqual({ items: [NOTIFICATION_ITEM], pagination: { page: 2, size: 20, totalCount: 41, hasNext: true } });
    });

    it('탈퇴한 회원의 알림도 조회할 수 있다', async () => {
      const service = new AdminNotificationsService(
        createNotificationsRepositoryStub(),
        createManagedUsersRepositoryStub({ userState: DELETED_USER_STATE }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      const result = await service.getUserNotifications(USER_ID, { page: 1, size: 20 });

      expect(result.items).toEqual([NOTIFICATION_ITEM]);
    });

    it('회원이 없으면 NotFoundException을 던진다', async () => {
      const service = new AdminNotificationsService(
        createNotificationsRepositoryStub(),
        createManagedUsersRepositoryStub({ userState: null }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.getUserNotifications(USER_ID, { page: 1, size: 20 })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('외부 transaction client를 저장소에 그대로 전달한다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const onCall = (_method: string, tx: unknown) => capturedTransactions.push(tx);
      const service = new AdminNotificationsService(
        createNotificationsRepositoryStub({ onCall }),
        createManagedUsersRepositoryStub({ onCall }),
        createAuditLogsServiceStub(),
        createPrismaServiceFailingTransactionStub(),
      );

      await service.getUserNotifications(USER_ID, { page: 1, size: 20 }, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx, externalTx]);
    });
  });

  describe('sendNotice', () => {
    it('NOTICE 알림을 만들고 같은 transaction으로 NOTIFICATION_SEND 감사 로그를 남긴다', async () => {
      const capturedInputs: CreateAdminNotificationInput[] = [];
      const capturedTransactions: unknown[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const onCall = (_method: string, tx: unknown) => capturedTransactions.push(tx);
      const service = new AdminNotificationsService(
        createNotificationsRepositoryStub({ onCall, onCreateNotification: input => capturedInputs.push(input) }),
        createManagedUsersRepositoryStub({ onCall }),
        createAuditLogsServiceStub(capturedAuditLogs),
        createPrismaServiceStub(),
      );

      const result = await service.sendNotice(ACTOR, USER_ID, NOTICE_CONTENT);

      expect(result).toEqual({ notificationId: NEW_NOTIFICATION_ID });
      expect(capturedInputs).toEqual([
        {
          userId: USER_ID,
          type: 'NOTICE',
          title: '서비스 점검 안내',
          description: '오늘 밤 점검합니다.',
          targetPath: '/notices',
          referenceType: null,
          referenceId: null,
        },
      ]);
      expect(capturedAuditLogs[0].input).toEqual({
        adminUserId: ADMIN_ID,
        action: 'NOTIFICATION_SEND',
        targetType: 'USER',
        targetId: USER_ID,
        detail: { notificationId: NEW_NOTIFICATION_ID, title: '서비스 점검 안내' },
      });
      expect(capturedTransactions).toEqual([TRANSACTION_CLIENT, TRANSACTION_CLIENT]);
      expect(capturedAuditLogs[0].tx).toBe(TRANSACTION_CLIENT);
    });

    it('설명과 이동 경로가 없으면 null로 저장한다', async () => {
      const capturedInputs: CreateAdminNotificationInput[] = [];
      const service = new AdminNotificationsService(
        createNotificationsRepositoryStub({ onCreateNotification: input => capturedInputs.push(input) }),
        createManagedUsersRepositoryStub(),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await service.sendNotice(ACTOR, USER_ID, { title: '안내' });

      expect(capturedInputs[0].description).toBeNull();
      expect(capturedInputs[0].targetPath).toBeNull();
    });

    it('회원이 없으면 NotFoundException을 던진다', async () => {
      const service = new AdminNotificationsService(
        createNotificationsRepositoryStub(),
        createManagedUsersRepositoryStub({ userState: null }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.sendNotice(ACTOR, USER_ID, NOTICE_CONTENT)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('탈퇴한 회원이면 NotFoundException을 던지고 알림을 만들지 않는다', async () => {
      const capturedInputs: CreateAdminNotificationInput[] = [];
      const service = new AdminNotificationsService(
        createNotificationsRepositoryStub({ onCreateNotification: input => capturedInputs.push(input) }),
        createManagedUsersRepositoryStub({ userState: DELETED_USER_STATE }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.sendNotice(ACTOR, USER_ID, NOTICE_CONTENT)).rejects.toBeInstanceOf(NotFoundException);
      expect(capturedInputs).toHaveLength(0);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const onCall = (_method: string, tx: unknown) => capturedTransactions.push(tx);
      const service = new AdminNotificationsService(
        createNotificationsRepositoryStub({ onCall }),
        createManagedUsersRepositoryStub({ onCall }),
        createAuditLogsServiceStub(capturedAuditLogs),
        createPrismaServiceFailingTransactionStub(),
      );

      await service.sendNotice(ACTOR, USER_ID, NOTICE_CONTENT, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx, externalTx]);
      expect(capturedAuditLogs[0].tx).toBe(externalTx);
    });
  });

  describe('resendNotification', () => {
    it('원본과 같은 내용의 새 알림을 만들고 NOTIFICATION_RESEND 감사 로그를 남긴다', async () => {
      const capturedInputs: CreateAdminNotificationInput[] = [];
      const capturedTransactions: unknown[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const service = new AdminNotificationsService(
        createNotificationsRepositoryStub({
          onCall: (_method, tx) => capturedTransactions.push(tx),
          onCreateNotification: input => capturedInputs.push(input),
        }),
        createManagedUsersRepositoryStub(),
        createAuditLogsServiceStub(capturedAuditLogs),
        createPrismaServiceStub(),
      );

      const result = await service.resendNotification(ACTOR, NOTIFICATION_ID);

      expect(result).toEqual({ notificationId: NEW_NOTIFICATION_ID });
      expect(capturedInputs).toEqual([NOTIFICATION_CONTENT]);
      expect(capturedAuditLogs[0].input).toEqual({
        adminUserId: ADMIN_ID,
        action: 'NOTIFICATION_RESEND',
        targetType: 'NOTIFICATION',
        targetId: NOTIFICATION_ID,
        detail: { newNotificationId: NEW_NOTIFICATION_ID },
      });
      expect(capturedTransactions).toEqual([TRANSACTION_CLIENT, TRANSACTION_CLIENT]);
      expect(capturedAuditLogs[0].tx).toBe(TRANSACTION_CLIENT);
    });

    it('공지가 아닌 알림(초대 등)은 재발송하지 않고 BadRequestException을 던진다', async () => {
      const capturedInputs: CreateAdminNotificationInput[] = [];
      const service = new AdminNotificationsService(
        createNotificationsRepositoryStub({
          source: { ...NOTIFICATION_SOURCE, type: 'INVITE', referenceType: 'BAND_INVITATION' },
          onCreateNotification: input => capturedInputs.push(input),
        }),
        createManagedUsersRepositoryStub(),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.resendNotification(ACTOR, NOTIFICATION_ID)).rejects.toThrow(new BadRequestException('공지 알림만 재발송할 수 있습니다.'));
      expect(capturedInputs).toHaveLength(0);
    });

    it('수신자가 탈퇴했으면 BadRequestException을 던진다', async () => {
      const service = new AdminNotificationsService(
        createNotificationsRepositoryStub({ source: { ...NOTIFICATION_SOURCE, isRecipientDeleted: true } }),
        createManagedUsersRepositoryStub(),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.resendNotification(ACTOR, NOTIFICATION_ID)).rejects.toThrow('탈퇴한 회원에게는 알림을 재발송할 수 없습니다.');
    });

    it('원본 알림이 없으면 NotFoundException을 던진다', async () => {
      const service = new AdminNotificationsService(
        createNotificationsRepositoryStub({ source: null }),
        createManagedUsersRepositoryStub(),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.resendNotification(ACTOR, NOTIFICATION_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const service = new AdminNotificationsService(
        createNotificationsRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) }),
        createManagedUsersRepositoryStub(),
        createAuditLogsServiceStub(capturedAuditLogs),
        createPrismaServiceFailingTransactionStub(),
      );

      await service.resendNotification(ACTOR, NOTIFICATION_ID, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx, externalTx]);
      expect(capturedAuditLogs[0].tx).toBe(externalTx);
    });
  });

  describe('broadcastNotice', () => {
    it('전체 발송 건수를 반환하고 NOTIFICATION_BROADCAST 감사 로그를 같은 transaction으로 남긴다', async () => {
      const capturedContents: AdminNoticeContent[] = [];
      const capturedTransactions: unknown[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const service = new AdminNotificationsService(
        createNotificationsRepositoryStub({
          broadcastCount: 120,
          onCall: (_method, tx) => capturedTransactions.push(tx),
          onCreateNoticeForActiveUsers: content => capturedContents.push(content),
        }),
        createManagedUsersRepositoryStub(),
        createAuditLogsServiceStub(capturedAuditLogs),
        createPrismaServiceStub(),
      );

      const result = await service.broadcastNotice(ACTOR, NOTICE_CONTENT);

      expect(result).toEqual({ sentCount: 120 });
      expect(capturedContents).toEqual([NOTICE_CONTENT]);
      expect(capturedAuditLogs[0].input).toEqual({
        adminUserId: ADMIN_ID,
        action: 'NOTIFICATION_BROADCAST',
        targetType: 'NOTIFICATION',
        targetId: null,
        detail: { title: '서비스 점검 안내', sentCount: 120 },
      });
      expect(capturedTransactions).toEqual([TRANSACTION_CLIENT]);
      expect(capturedAuditLogs[0].tx).toBe(TRANSACTION_CLIENT);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const capturedAuditLogs: CapturedAuditLog[] = [];
      const service = new AdminNotificationsService(
        createNotificationsRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) }),
        createManagedUsersRepositoryStub(),
        createAuditLogsServiceStub(capturedAuditLogs),
        createPrismaServiceFailingTransactionStub(),
      );

      await service.broadcastNotice(ACTOR, NOTICE_CONTENT, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx]);
      expect(capturedAuditLogs[0].tx).toBe(externalTx);
    });
  });
});
