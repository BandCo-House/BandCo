import { BadRequestException, HttpException, HttpStatus, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import type { AdminAuditLogsRepository } from './repositories/admin-audit-logs.repository';
import type { AdminUserRecord, AdminUsersRepository, UpdateAdminUserData } from './repositories/admin-users.repository';
import type { RecordAdminAuditLogInput } from './types/admin-audit.type';
import { AdminAuditLogsService } from './admin-audit-logs.service';
import { ADMIN_LOGIN_LOCK_WINDOW_MS, ADMIN_LOGIN_MAX_FAILURES, AdminAuthService, normalizeAdminEmail } from './admin-auth.service';

// ─── 상수 ─────────────────────────────────────────────────────────
const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const ADMIN_SECRET = 'admin-test-secret';
const USER_SECRET = 'user-test-secret';
const PASSWORD = 'correct-password';
// 테스트 속도를 위해 최소 rounds로 해시를 만든다
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4);
const NOW_SECONDS = Math.floor(Date.now() / 1000);

const createAdminRecord = (overrides?: Partial<AdminUserRecord>): AdminUserRecord => ({
  id: ADMIN_ID,
  email: 'admin@bandco.kr',
  passwordHash: PASSWORD_HASH,
  name: '관리자',
  role: 'SUPER_ADMIN',
  isActive: true,
  lastLoginAt: null,
  passwordChangedAt: null,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  ...overrides,
});

// ─── Stub ────────────────────────────────────────────────────────
type Observed = {
  updates: { id: string; data: UpdateAdminUserData; tx: unknown }[];
  audits: { input: RecordAdminAuditLogInput; tx: unknown }[];
  findByEmailArgs: string[];
};

function createAdminUsersRepositoryStub(admin: AdminUserRecord | null, observed: Observed): AdminUsersRepository {
  return {
    async findById() {
      return admin;
    },
    async findByEmail(email) {
      observed.findByEmailArgs.push(email);
      return admin;
    },
    async findAll() {
      return admin ? [admin] : [];
    },
    async create() {
      throw new Error('사용하지 않는다');
    },
    async update(id, data, tx) {
      observed.updates.push({ id, data, tx });
      return { ...(admin as AdminUserRecord), ...data } as AdminUserRecord;
    },
  };
}

function createAuditLogsService(observed: Observed): AdminAuditLogsService {
  const repository: AdminAuditLogsRepository = {
    async create(input, tx) {
      observed.audits.push({ input, tx });
    },
    async findMany() {
      return { items: [], totalCount: 0 };
    },
  };
  return new AdminAuditLogsService(repository);
}

function createConfigServiceStub(values: Record<string, string>): ConfigService {
  return {
    getOrThrow(key: string) {
      if (!(key in values)) throw new Error(`missing ${key}`);
      return values[key];
    },
    get(key: string) {
      return values[key];
    },
  } as unknown as ConfigService;
}

const DEFAULT_CONFIG = { ADMIN_JWT_SECRET: ADMIN_SECRET, JWT_SECRET: USER_SECRET, BCRYPT_SALT_ROUNDS: '4' };
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

function setup(options?: { admin?: AdminUserRecord | null; config?: Record<string, string>; prisma?: PrismaService }) {
  const observed: Observed = { updates: [], audits: [], findByEmailArgs: [] };
  const admin = options?.admin === undefined ? createAdminRecord() : options.admin;
  const jwtService = new JwtService({});
  const service = new AdminAuthService(
    createAdminUsersRepositoryStub(admin, observed),
    createAuditLogsService(observed),
    jwtService,
    createConfigServiceStub(options?.config ?? DEFAULT_CONFIG),
    options?.prisma ?? createPrismaServiceStub(),
  );
  return { service, observed, jwtService };
}

describe('AdminAuthService', () => {
  describe('생성자 설정 검증', () => {
    it('ADMIN_JWT_SECRET이 없으면 초기화 시 에러를 던진다', () => {
      expect(() => setup({ config: { JWT_SECRET: USER_SECRET, BCRYPT_SALT_ROUNDS: '4' } })).toThrow('missing ADMIN_JWT_SECRET');
    });

    it('ADMIN_JWT_SECRET이 유저 JWT_SECRET과 같으면 초기화 시 에러를 던진다', () => {
      expect(() => setup({ config: { ...DEFAULT_CONFIG, ADMIN_JWT_SECRET: USER_SECRET } })).toThrow('ADMIN_JWT_SECRET must differ from JWT_SECRET');
    });
  });

  describe('normalizeAdminEmail', () => {
    it('앞뒤 공백을 지우고 소문자로 바꾼다', () => {
      expect(normalizeAdminEmail('  Admin@BandCo.KR ')).toBe('admin@bandco.kr');
    });
  });

  describe('login', () => {
    it('올바른 계정이면 토큰 쌍과 어드민 정보를 반환하고 접속 시각·감사 로그를 같은 tx로 남긴다', async () => {
      const { service, observed } = setup();

      const result = await service.login('Admin@BandCo.kr', PASSWORD);

      expect(observed.findByEmailArgs).toEqual(['admin@bandco.kr']);
      expect(result.admin).toEqual(expect.objectContaining({ adminId: ADMIN_ID, role: 'SUPER_ADMIN' }));
      expect(result.admin).not.toHaveProperty('passwordHash');
      expect(service.verifyToken(result.accessToken, 'access').sub).toBe(ADMIN_ID);
      expect(service.verifyToken(result.refreshToken, 'refresh').sub).toBe(ADMIN_ID);
      expect(observed.updates).toEqual([{ id: ADMIN_ID, data: { lastLoginAt: expect.any(Date) }, tx: TX_CLIENT }]);
      expect(observed.audits).toEqual([
        { input: { adminUserId: ADMIN_ID, action: 'ADMIN_LOGIN', targetType: 'ADMIN', targetId: ADMIN_ID }, tx: TX_CLIENT },
      ]);
    });

    it('계정이 없으면 UnauthorizedException을 던진다', async () => {
      const { service } = setup({ admin: null });

      await expect(service.login('none@bandco.kr', PASSWORD)).rejects.toThrow(new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.'));
    });

    it('비활성 계정이면 비밀번호가 맞아도 같은 메시지로 UnauthorizedException을 던진다', async () => {
      const { service, observed } = setup({ admin: createAdminRecord({ isActive: false }) });

      await expect(service.login('admin@bandco.kr', PASSWORD)).rejects.toThrow('이메일 또는 비밀번호가 올바르지 않습니다.');
      expect(observed.audits).toHaveLength(0);
    });

    it('비밀번호가 틀리면 UnauthorizedException을 던지고 기록을 남기지 않는다', async () => {
      const { service, observed } = setup();

      await expect(service.login('admin@bandco.kr', 'wrong-password')).rejects.toThrow(UnauthorizedException);
      expect(observed.updates).toHaveLength(0);
    });

    it('외부 tx가 전달되면 새 transaction을 열지 않고 그대로 전달한다', async () => {
      const { service, observed } = setup({ prisma: createPrismaServiceFailingTransactionStub() });
      const externalTx = { external: true } as unknown as Prisma.TransactionClient;

      await service.login('admin@bandco.kr', PASSWORD, externalTx);

      expect(observed.updates[0].tx).toBe(externalTx);
      expect(observed.audits[0].tx).toBe(externalTx);
    });
  });

  describe('login - 연속 실패 잠금', () => {
    it(`같은 이메일로 ${ADMIN_LOGIN_MAX_FAILURES}번 실패하면 올바른 비밀번호여도 429로 막는다`, async () => {
      const { service } = setup();
      for (let attempt = 0; attempt < ADMIN_LOGIN_MAX_FAILURES; attempt += 1) {
        await expect(service.login('admin@bandco.kr', 'wrong-password')).rejects.toThrow(UnauthorizedException);
      }

      const locked = service.login('ADMIN@bandco.kr', PASSWORD);

      await expect(locked).rejects.toThrow(HttpException);
      await expect(locked).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
    });

    it('한도 전에 성공하면 실패 횟수를 초기화한다', async () => {
      const { service } = setup();
      for (let attempt = 0; attempt < ADMIN_LOGIN_MAX_FAILURES - 1; attempt += 1) {
        await expect(service.login('admin@bandco.kr', 'wrong-password')).rejects.toThrow(UnauthorizedException);
      }
      await service.login('admin@bandco.kr', PASSWORD);

      await expect(service.login('admin@bandco.kr', 'wrong-password')).rejects.toThrow(UnauthorizedException);
      await expect(service.login('admin@bandco.kr', PASSWORD)).resolves.toEqual(expect.objectContaining({ accessToken: expect.any(String) }));
    });

    it('잠금 구간이 지나면 다시 시도할 수 있다', async () => {
      const { service } = setup();
      const realNow = Date.now;
      const startedAt = realNow();
      try {
        Date.now = () => startedAt;
        for (let attempt = 0; attempt < ADMIN_LOGIN_MAX_FAILURES; attempt += 1) {
          await expect(service.login('admin@bandco.kr', 'wrong-password')).rejects.toThrow(UnauthorizedException);
        }
        Date.now = () => startedAt + ADMIN_LOGIN_LOCK_WINDOW_MS;

        await expect(service.login('admin@bandco.kr', PASSWORD)).resolves.toEqual(expect.objectContaining({ accessToken: expect.any(String) }));
      } finally {
        Date.now = realNow;
      }
    });
  });

  describe('verifyToken', () => {
    it('리프레시 토큰을 액세스 토큰으로 쓰면 UnauthorizedException을 던진다', () => {
      const { service } = setup();
      const refreshToken = service.signToken(ADMIN_ID, 'refresh');

      expect(() => service.verifyToken(refreshToken, 'access')).toThrow('액세스 토큰이 아닙니다.');
    });

    it('유저 시크릿으로 서명한 서비스 유저 토큰은 거부한다', () => {
      const { service, jwtService } = setup();
      const userToken = jwtService.sign({ id: ADMIN_ID, email: 'u@u.com', type: 'access' }, { secret: USER_SECRET });

      expect(() => service.verifyToken(userToken, 'access')).toThrow('유효하지 않은 토큰입니다.');
    });

    it('어드민 시크릿이어도 scope가 admin이 아니면 거부한다', () => {
      const { service, jwtService } = setup();
      const forgedToken = jwtService.sign({ sub: ADMIN_ID, type: 'access' }, { secret: ADMIN_SECRET });

      expect(() => service.verifyToken(forgedToken, 'access')).toThrow('유효하지 않은 토큰입니다.');
    });

    it('만료된 토큰이면 만료 메시지로 UnauthorizedException을 던진다', () => {
      const { service, jwtService } = setup();
      const expiredToken = jwtService.sign(
        { sub: ADMIN_ID, type: 'access', scope: 'admin', exp: Math.floor(Date.now() / 1000) - 60 },
        { secret: ADMIN_SECRET },
      );

      expect(() => service.verifyToken(expiredToken, 'access')).toThrow('만료된 토큰입니다.');
    });
  });

  describe('getActivePrincipal', () => {
    it('활성 어드민이면 가드에 담을 정보를 반환한다', async () => {
      const { service } = setup();

      await expect(service.getActivePrincipal(ADMIN_ID, NOW_SECONDS)).resolves.toEqual({
        id: ADMIN_ID,
        email: 'admin@bandco.kr',
        name: '관리자',
        role: 'SUPER_ADMIN',
      });
    });

    it('비활성 어드민이면 null을 반환한다', async () => {
      const { service } = setup({ admin: createAdminRecord({ isActive: false }) });

      await expect(service.getActivePrincipal(ADMIN_ID, NOW_SECONDS)).resolves.toBeNull();
    });

    it('비밀번호를 바꾸기 전에 발급된 토큰이면 null을 반환한다', async () => {
      const passwordChangedAt = new Date('2026-10-05T10:00:00.500Z');
      const { service } = setup({ admin: createAdminRecord({ passwordChangedAt }) });
      const issuedBeforeChange = Math.floor(passwordChangedAt.getTime() / 1000) - 1;

      await expect(service.getActivePrincipal(ADMIN_ID, issuedBeforeChange)).resolves.toBeNull();
    });

    it('비밀번호를 바꾼 같은 초에 발급된 토큰은 통과시킨다', async () => {
      const passwordChangedAt = new Date('2026-10-05T10:00:00.500Z');
      const { service } = setup({ admin: createAdminRecord({ passwordChangedAt }) });
      const issuedSameSecond = Math.floor(passwordChangedAt.getTime() / 1000);

      await expect(service.getActivePrincipal(ADMIN_ID, issuedSameSecond)).resolves.not.toBeNull();
    });

    it('비밀번호 변경 이력이 있는데 발급 시각이 없는 토큰이면 null을 반환한다', async () => {
      const { service } = setup({ admin: createAdminRecord({ passwordChangedAt: new Date('2026-10-05T10:00:00.000Z') }) });

      await expect(service.getActivePrincipal(ADMIN_ID, undefined)).resolves.toBeNull();
    });
  });

  describe('hashPassword', () => {
    it('설정된 salt rounds로 bcrypt 해시를 만든다', async () => {
      const { service } = setup();

      const hash = await service.hashPassword('some-password');

      expect(bcrypt.getRounds(hash)).toBe(4);
      expect(await bcrypt.compare('some-password', hash)).toBe(true);
    });
  });

  describe('getMyProfile', () => {
    it('어드민 정보를 응답 형식으로 반환한다', async () => {
      const { service } = setup();

      await expect(service.getMyProfile(ADMIN_ID)).resolves.toEqual({
        adminId: ADMIN_ID,
        email: 'admin@bandco.kr',
        name: '관리자',
        role: 'SUPER_ADMIN',
        isActive: true,
        lastLoginAt: null,
        createdAt: '2026-10-01T00:00:00.000Z',
      });
    });

    it('계정이 없으면 NotFoundException을 던진다', async () => {
      const { service } = setup({ admin: null });

      await expect(service.getMyProfile(ADMIN_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeMyPassword', () => {
    it('현재 비밀번호가 맞으면 새 해시로 바꾸고 감사 로그를 남긴다', async () => {
      const { service, observed } = setup();

      const result = await service.changeMyPassword(ADMIN_ID, PASSWORD, 'new-password-1');

      expect(result.adminId).toBe(ADMIN_ID);
      expect(service.verifyToken(result.accessToken, 'access').sub).toBe(ADMIN_ID);
      expect(service.verifyToken(result.refreshToken, 'refresh').sub).toBe(ADMIN_ID);
      expect(observed.updates[0].data.passwordChangedAt).toBeInstanceOf(Date);

      const savedHash = observed.updates[0].data.passwordHash as string;
      expect(await bcrypt.compare('new-password-1', savedHash)).toBe(true);
      expect(observed.audits[0]).toEqual({
        input: { adminUserId: ADMIN_ID, action: 'ADMIN_PASSWORD_CHANGE', targetType: 'ADMIN', targetId: ADMIN_ID },
        tx: TX_CLIENT,
      });
    });

    it('현재 비밀번호가 틀리면 BadRequestException을 던진다', async () => {
      const { service } = setup();

      await expect(service.changeMyPassword(ADMIN_ID, 'wrong', 'new-password-1')).rejects.toThrow(BadRequestException);
    });

    it('새 비밀번호가 현재와 같으면 BadRequestException을 던진다', async () => {
      const { service } = setup();

      await expect(service.changeMyPassword(ADMIN_ID, PASSWORD, PASSWORD)).rejects.toThrow('새 비밀번호가 현재 비밀번호와 같습니다.');
    });

    it('계정이 없으면 NotFoundException을 던진다', async () => {
      const { service } = setup({ admin: null });

      await expect(service.changeMyPassword(ADMIN_ID, PASSWORD, 'new-password-1')).rejects.toThrow(NotFoundException);
    });

    it('외부 tx가 전달되면 새 transaction을 열지 않고 그대로 전달한다', async () => {
      const { service, observed } = setup({ prisma: createPrismaServiceFailingTransactionStub() });
      const externalTx = { external: true } as unknown as Prisma.TransactionClient;

      await service.changeMyPassword(ADMIN_ID, PASSWORD, 'new-password-1', externalTx);

      expect(observed.updates[0].tx).toBe(externalTx);
    });
  });
});
