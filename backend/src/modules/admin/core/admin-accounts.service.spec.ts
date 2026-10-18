import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';
import { Prisma } from 'src/generated/prisma';

import type { AdminAuditLogsRepository } from './repositories/admin-audit-logs.repository';
import type { AdminUserRecord, AdminUsersRepository, CreateAdminUserData, UpdateAdminUserData } from './repositories/admin-users.repository';
import type { RecordAdminAuditLogInput } from './types/admin-audit.type';
import type { AdminPrincipal } from './types/admin-principal.type';
import { AdminAccountsService } from './admin-accounts.service';
import { AdminAuditLogsService } from './admin-audit-logs.service';
import type { AdminAuthService } from './admin-auth.service';

// ─── 상수 ─────────────────────────────────────────────────────────
const ACTOR_ID = '11111111-1111-4111-8111-111111111111';
const TARGET_ID = '22222222-2222-4222-8222-222222222222';
const ACTOR: AdminPrincipal = { id: ACTOR_ID, email: 'super@bandco.kr', name: '최고관리자', role: 'SUPER_ADMIN' };

const createAdminRecord = (overrides?: Partial<AdminUserRecord>): AdminUserRecord => ({
  id: TARGET_ID,
  email: 'operator@bandco.kr',
  passwordHash: 'hash',
  name: '운영자',
  role: 'OPERATOR',
  isActive: true,
  lastLoginAt: null,
  passwordChangedAt: null,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  ...overrides,
});

// ─── Stub ────────────────────────────────────────────────────────
type Observed = {
  creates: { data: CreateAdminUserData; tx: unknown }[];
  updates: { id: string; data: UpdateAdminUserData; tx: unknown }[];
  audits: { input: RecordAdminAuditLogInput; tx: unknown }[];
  lockTxs: unknown[];
};

function setup(options?: {
  existingByEmail?: AdminUserRecord | null;
  target?: AdminUserRecord | null;
  prisma?: PrismaService;
  createError?: Error;
  activeSuperAdminIds?: string[];
}) {
  const observed: Observed = { creates: [], updates: [], audits: [], lockTxs: [] };
  const target = options?.target === undefined ? createAdminRecord() : options.target;

  const repository: AdminUsersRepository = {
    async findById() {
      return target;
    },
    async findByEmail() {
      return options?.existingByEmail ?? null;
    },
    async findAll() {
      return [createAdminRecord()];
    },
    async create(data, tx) {
      if (options?.createError) throw options.createError;
      observed.creates.push({ data, tx });
      return createAdminRecord({ email: data.email, name: data.name, role: data.role, passwordHash: data.passwordHash });
    },
    async update(id, data, tx) {
      observed.updates.push({ id, data, tx });
      return { ...createAdminRecord(), ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) } as AdminUserRecord;
    },
    async lockActiveSuperAdmins(tx) {
      observed.lockTxs.push(tx);
      return options?.activeSuperAdminIds ?? [ACTOR_ID];
    },
  };

  const auditLogsRepository: AdminAuditLogsRepository = {
    async create(input, tx) {
      observed.audits.push({ input, tx });
    },
    async findMany() {
      return { items: [], totalCount: 0 };
    },
  };

  // 해시 자체는 AdminAuthService 테스트에서 검증하므로 여기서는 결정적인 값만 돌려준다
  const adminAuthServiceStub = {
    async hashPassword(password: string) {
      return `hashed:${password}`;
    },
  } as unknown as AdminAuthService;

  const service = new AdminAccountsService(
    repository,
    adminAuthServiceStub,
    new AdminAuditLogsService(auditLogsRepository),
    options?.prisma ?? createPrismaServiceStub(),
  );
  return { service, observed };
}

const TX_CLIENT = { transactionClient: true } as unknown as Prisma.TransactionClient;

function createPrismaServiceStub(): PrismaService {
  return {
    async $transaction(callback: (tx: Prisma.TransactionClient) => Promise<unknown>) {
      return callback(TX_CLIENT);
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

describe('AdminAccountsService', () => {
  describe('getAdmins', () => {
    it('비밀번호 해시 없이 어드민 목록을 반환한다', async () => {
      const { service } = setup();

      const result = await service.getAdmins();

      expect(result.admins).toHaveLength(1);
      expect(result.admins[0]).toEqual(expect.objectContaining({ adminId: TARGET_ID, role: 'OPERATOR' }));
      expect(result.admins[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('createAdmin', () => {
    it('이메일을 정규화하고 해시한 비밀번호로 생성한 뒤 감사 로그를 같은 tx로 남긴다', async () => {
      const { service, observed } = setup();

      const result = await service.createAdmin(ACTOR, { email: ' New@BandCo.kr ', name: '신규', password: 'password1', role: 'OPERATOR' });

      expect(observed.creates).toEqual([
        { data: { email: 'new@bandco.kr', passwordHash: 'hashed:password1', name: '신규', role: 'OPERATOR' }, tx: TX_CLIENT },
      ]);
      expect(result.email).toBe('new@bandco.kr');
      expect(observed.audits).toEqual([
        {
          input: {
            adminUserId: ACTOR_ID,
            action: 'ADMIN_CREATE',
            targetType: 'ADMIN',
            targetId: TARGET_ID,
            detail: { email: 'new@bandco.kr', role: 'OPERATOR' },
          },
          tx: TX_CLIENT,
        },
      ]);
    });

    it('사전 검사 후 동시 생성으로 유니크 제약(P2002)에 걸려도 ConflictException으로 바꾼다', async () => {
      const uniqueViolation = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' });
      const { service } = setup({ createError: uniqueViolation });

      await expect(service.createAdmin(ACTOR, { email: 'new@bandco.kr', name: '신규', password: 'password1', role: 'OPERATOR' })).rejects.toThrow(
        new ConflictException('이미 등록된 어드민 이메일입니다.'),
      );
    });

    it('이미 등록된 이메일이면 ConflictException을 던진다', async () => {
      const { service, observed } = setup({ existingByEmail: createAdminRecord() });

      await expect(
        service.createAdmin(ACTOR, { email: 'operator@bandco.kr', name: '중복', password: 'password1', role: 'OPERATOR' }),
      ).rejects.toThrow(ConflictException);
      expect(observed.creates).toHaveLength(0);
    });

    it('외부 tx가 전달되면 새 transaction을 열지 않고 그대로 전달한다', async () => {
      const { service, observed } = setup({ prisma: createPrismaServiceFailingTransactionStub() });
      const externalTx = { external: true } as unknown as Prisma.TransactionClient;

      await service.createAdmin(ACTOR, { email: 'new@bandco.kr', name: '신규', password: 'password1', role: 'OPERATOR' }, externalTx);

      expect(observed.creates[0].tx).toBe(externalTx);
      expect(observed.audits[0].tx).toBe(externalTx);
    });
  });

  describe('updateAdmin', () => {
    it('다른 어드민의 역할·활성 여부를 바꾸고 감사 로그를 남긴다', async () => {
      const { service, observed } = setup();

      const result = await service.updateAdmin(ACTOR, TARGET_ID, { role: 'SUPER_ADMIN', isActive: false });

      expect(result).toEqual(expect.objectContaining({ role: 'SUPER_ADMIN', isActive: false }));
      expect(observed.updates[0]).toEqual({ id: TARGET_ID, data: { name: undefined, role: 'SUPER_ADMIN', isActive: false }, tx: TX_CLIENT });
      expect(observed.audits[0].input).toEqual({
        adminUserId: ACTOR_ID,
        action: 'ADMIN_UPDATE',
        targetType: 'ADMIN',
        targetId: TARGET_ID,
        detail: { name: null, role: 'SUPER_ADMIN', isActive: false },
      });
    });

    it('본인 역할을 OPERATOR로 낮추려 하면 BadRequestException을 던진다', async () => {
      const { service, observed } = setup();

      await expect(service.updateAdmin(ACTOR, ACTOR_ID, { role: 'OPERATOR' })).rejects.toThrow(
        new BadRequestException('본인의 역할은 낮출 수 없습니다.'),
      );
      expect(observed.updates).toHaveLength(0);
    });

    it('본인 계정을 비활성화하려 하면 BadRequestException을 던진다', async () => {
      const { service } = setup();

      await expect(service.updateAdmin(ACTOR, ACTOR_ID, { isActive: false })).rejects.toThrow('본인 계정은 비활성화할 수 없습니다.');
    });

    it('본인 이름은 바꿀 수 있다', async () => {
      const { service, observed } = setup();

      await service.updateAdmin(ACTOR, ACTOR_ID, { name: '새이름' });

      expect(observed.updates).toHaveLength(1);
    });

    it('대상 계정이 없으면 NotFoundException을 던진다', async () => {
      const { service } = setup({ target: null });

      await expect(service.updateAdmin(ACTOR, TARGET_ID, { name: '이름' })).rejects.toThrow(NotFoundException);
    });

    it('마지막 활성 SUPER_ADMIN을 강등하려 하면 BadRequestException을 던진다', async () => {
      const { service, observed } = setup({ target: createAdminRecord({ role: 'SUPER_ADMIN' }), activeSuperAdminIds: [TARGET_ID] });

      await expect(service.updateAdmin(ACTOR, TARGET_ID, { role: 'OPERATOR' })).rejects.toThrow(
        new BadRequestException('활성 최고 관리자는 최소 한 명 있어야 합니다.'),
      );
      expect(observed.updates).toHaveLength(0);
    });

    it('마지막 활성 SUPER_ADMIN을 비활성화하려 하면 BadRequestException을 던진다', async () => {
      const { service, observed } = setup({ target: createAdminRecord({ role: 'SUPER_ADMIN' }), activeSuperAdminIds: [TARGET_ID] });

      await expect(service.updateAdmin(ACTOR, TARGET_ID, { isActive: false })).rejects.toThrow('활성 최고 관리자는 최소 한 명 있어야 합니다.');
      expect(observed.updates).toHaveLength(0);
    });

    it('다른 활성 SUPER_ADMIN이 남으면 SUPER_ADMIN을 강등할 수 있고 같은 tx로 잠근다', async () => {
      const { service, observed } = setup({ target: createAdminRecord({ role: 'SUPER_ADMIN' }), activeSuperAdminIds: [ACTOR_ID, TARGET_ID] });

      await service.updateAdmin(ACTOR, TARGET_ID, { role: 'OPERATOR' });

      expect(observed.lockTxs).toEqual([TX_CLIENT]);
      expect(observed.updates).toHaveLength(1);
    });

    it('강등·비활성화가 아닌 변경은 SUPER_ADMIN 행을 잠그지 않는다', async () => {
      const { service, observed } = setup();

      await service.updateAdmin(ACTOR, TARGET_ID, { name: '이름', role: 'SUPER_ADMIN', isActive: true });

      expect(observed.lockTxs).toHaveLength(0);
    });

    it('외부 tx가 전달되면 새 transaction을 열지 않고 그대로 전달한다', async () => {
      const { service, observed } = setup({ prisma: createPrismaServiceFailingTransactionStub() });
      const externalTx = { external: true } as unknown as Prisma.TransactionClient;

      await service.updateAdmin(ACTOR, TARGET_ID, { name: '이름' }, externalTx);

      expect(observed.updates[0].tx).toBe(externalTx);
    });
  });

  describe('resetAdminPassword', () => {
    it('해시한 새 비밀번호로 바꾸고 감사 로그를 남긴다', async () => {
      const { service, observed } = setup();

      await expect(service.resetAdminPassword(ACTOR, TARGET_ID, 'new-password')).resolves.toEqual({ adminId: TARGET_ID });

      expect(observed.updates[0].data).toEqual({ passwordHash: 'hashed:new-password', passwordChangedAt: expect.any(Date) });
      expect(observed.audits[0]).toEqual({
        input: { adminUserId: ACTOR_ID, action: 'ADMIN_PASSWORD_RESET', targetType: 'ADMIN', targetId: TARGET_ID },
        tx: TX_CLIENT,
      });
    });

    it('대상 계정이 없으면 NotFoundException을 던진다', async () => {
      const { service } = setup({ target: null });

      await expect(service.resetAdminPassword(ACTOR, TARGET_ID, 'new-password')).rejects.toThrow(NotFoundException);
    });

    it('본인 비밀번호를 초기화하려 하면 BadRequestException을 던지고 바꾸지 않는다', async () => {
      const { service, observed } = setup();

      await expect(service.resetAdminPassword(ACTOR, ACTOR_ID, 'new-password')).rejects.toThrow(
        new BadRequestException('본인 비밀번호는 비밀번호 변경 메뉴에서 바꿔 주세요.'),
      );
      expect(observed.updates).toHaveLength(0);
    });

    it('외부 tx가 전달되면 새 transaction을 열지 않고 그대로 전달한다', async () => {
      const { service, observed } = setup({ prisma: createPrismaServiceFailingTransactionStub() });
      const externalTx = { external: true } as unknown as Prisma.TransactionClient;

      await service.resetAdminPassword(ACTOR, TARGET_ID, 'new-password', externalTx);

      expect(observed.updates[0].tx).toBe(externalTx);
    });
  });
});
