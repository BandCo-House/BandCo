import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/database/prisma/prisma.service';
import type { Prisma } from 'src/generated/prisma';
import { UsersService } from 'src/modules/users/users.service';

import { AuthService } from './auth.service';
import { GoogleAuthClient } from './google-auth.client';

const TEST_JWT_SECRET = 'test-secret';
const TEST_BCRYPT_SALT_ROUNDS = 10;

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockUsersService = {
  getUserByEmail: jest.fn(),
  getUserForPasswordAuth: jest.fn(),
  createUserWithEmail: jest.fn(),
  getUserByOAuth: jest.fn(),
  getUserForOAuthLink: jest.fn(),
  linkOAuthAccount: jest.fn(),
  createUserWithGoogle: jest.fn(),
};

const mockConfigService = {
  getOrThrow: jest.fn((key: string) => {
    if (key === 'JWT_SECRET') return TEST_JWT_SECRET;
    if (key === 'BCRYPT_SALT_ROUNDS') return String(TEST_BCRYPT_SALT_ROUNDS);
    throw new Error(`Unknown config key: ${key}`);
  }),
};

const mockGoogleAuthClient = {
  verifyIdToken: jest.fn(),
};

// $transaction 진입 시 콜백에 전달되는 transaction client
const mockTransactionClient = { transactionClient: true } as unknown as Prisma.TransactionClient;

const mockPrismaService = {
  $transaction: jest.fn(async (callback: (tx: Prisma.TransactionClient) => Promise<unknown>) => callback(mockTransactionClient)),
};

const buildModule = (configOverride?: Partial<typeof mockConfigService>) =>
  Test.createTestingModule({
    providers: [
      AuthService,
      { provide: JwtService, useValue: mockJwtService },
      { provide: UsersService, useValue: mockUsersService },
      { provide: ConfigService, useValue: { ...mockConfigService, ...configOverride } },
      { provide: GoogleAuthClient, useValue: mockGoogleAuthClient },
      { provide: PrismaService, useValue: mockPrismaService },
    ],
  }).compile();

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await buildModule();
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('생성자 설정 검증', () => {
    it('JWT_SECRET이 빈 문자열이면 초기화 시 에러를 던진다', async () => {
      await expect(
        buildModule({ getOrThrow: jest.fn((key: string) => (key === 'JWT_SECRET' ? '' : String(TEST_BCRYPT_SALT_ROUNDS))) }),
      ).rejects.toThrow('JWT_SECRET must not be empty');
    });

    it('BCRYPT_SALT_ROUNDS가 숫자가 아니면 초기화 시 에러를 던진다', async () => {
      await expect(buildModule({ getOrThrow: jest.fn((key: string) => (key === 'JWT_SECRET' ? TEST_JWT_SECRET : 'abc')) })).rejects.toThrow(
        'BCRYPT_SALT_ROUNDS must be a number between 4 and 15',
      );
    });

    it('BCRYPT_SALT_ROUNDS가 허용 범위(4~15)를 벗어나면 초기화 시 에러를 던진다', async () => {
      await expect(buildModule({ getOrThrow: jest.fn((key: string) => (key === 'JWT_SECRET' ? TEST_JWT_SECRET : '3')) })).rejects.toThrow(
        'BCRYPT_SALT_ROUNDS must be a number between 4 and 15',
      );
    });
  });

  describe('extractTokenFromHeader', () => {
    it('Bearer 토큰을 정상적으로 추출한다', () => {
      expect(service.extractTokenFromHeader('Bearer mytoken', true)).toBe('mytoken');
    });

    it('Basic 토큰을 정상적으로 추출한다', () => {
      expect(service.extractTokenFromHeader('Basic mytoken', false)).toBe('mytoken');
    });

    it('prefix가 틀리면 UnauthorizedException을 던진다', () => {
      expect(() => service.extractTokenFromHeader('Token mytoken', true)).toThrow(UnauthorizedException);
    });

    it('공백으로 분리된 부분이 2개가 아니면 UnauthorizedException을 던진다', () => {
      expect(() => service.extractTokenFromHeader('Beareronly', true)).toThrow(UnauthorizedException);
    });
  });

  describe('decodeBasicToken', () => {
    it('base64로 인코딩된 email:password를 정상적으로 디코딩한다', () => {
      const encoded = Buffer.from('user@test.com:secret').toString('base64');
      expect(service.decodeBasicToken(encoded)).toEqual({ email: 'user@test.com', password: 'secret' });
    });

    it('콜론이 없는 토큰은 UnauthorizedException을 던진다', () => {
      const encoded = Buffer.from('nodivider').toString('base64');
      expect(() => service.decodeBasicToken(encoded)).toThrow(UnauthorizedException);
    });
  });

  describe('signToken', () => {
    it('access 타입으로 서명 시 5m 만료로 호출된다', () => {
      mockJwtService.sign.mockReturnValue('signed-access');
      const result = service.signToken('u@u.com', 'uid', false);
      expect(mockJwtService.sign).toHaveBeenCalledWith({ email: 'u@u.com', id: 'uid', type: 'access' }, { secret: TEST_JWT_SECRET, expiresIn: '5m' });
      expect(result).toBe('signed-access');
    });

    it('refresh 타입으로 서명 시 1h 만료로 호출된다', () => {
      mockJwtService.sign.mockReturnValue('signed-refresh');
      const result = service.signToken('u@u.com', 'uid', true);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { email: 'u@u.com', id: 'uid', type: 'refresh' },
        { secret: TEST_JWT_SECRET, expiresIn: '1h' },
      );
      expect(result).toBe('signed-refresh');
    });
  });

  describe('loginUser', () => {
    it('accessToken과 refreshToken을 함께 반환한다', () => {
      mockJwtService.sign.mockReturnValueOnce('access').mockReturnValueOnce('refresh');
      expect(service.loginUser('u@u.com', 'uid')).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
    });
  });

  describe('verifyToken', () => {
    it('jamplay secret으로 토큰을 검증한다', () => {
      const payload = { email: 'u@u.com', id: 'uid', type: 'access' };
      mockJwtService.verify.mockReturnValue(payload);
      expect(service.verifyToken('some.token')).toEqual(payload);
      expect(mockJwtService.verify).toHaveBeenCalledWith('some.token', { secret: TEST_JWT_SECRET });
    });
  });

  describe('authenticateWithEmailAndPassword', () => {
    it('유저가 존재하지 않으면 UnauthorizedException을 던진다', async () => {
      mockUsersService.getUserForPasswordAuth.mockResolvedValue(null);
      await expect(service.authenticateWithEmailAndPassword('u@u.com', 'pw')).rejects.toThrow(UnauthorizedException);
    });

    it('유저에 email이 없으면 UnauthorizedException을 던진다', async () => {
      mockUsersService.getUserForPasswordAuth.mockResolvedValue({ id: 'uid', email: null, passwordHash: 'hash' });
      await expect(service.authenticateWithEmailAndPassword('u@u.com', 'pw')).rejects.toThrow(UnauthorizedException);
    });

    it('유저에 passwordHash가 없으면 UnauthorizedException을 던진다', async () => {
      mockUsersService.getUserForPasswordAuth.mockResolvedValue({ id: 'uid', email: 'u@u.com', passwordHash: null });
      await expect(service.authenticateWithEmailAndPassword('u@u.com', 'pw')).rejects.toThrow(UnauthorizedException);
    });

    it('비밀번호가 틀리면 UnauthorizedException을 던진다', async () => {
      mockUsersService.getUserForPasswordAuth.mockResolvedValue({ id: 'uid', email: 'u@u.com', passwordHash: 'hash' });
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);
      await expect(service.authenticateWithEmailAndPassword('u@u.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('인증 성공 시 id와 email을 반환한다', async () => {
      mockUsersService.getUserForPasswordAuth.mockResolvedValue({ id: 'uid', email: 'u@u.com', passwordHash: 'hash' });
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      await expect(service.authenticateWithEmailAndPassword('u@u.com', 'correct')).resolves.toEqual({
        id: 'uid',
        email: 'u@u.com',
      });
    });
  });

  describe('loginWithEmail', () => {
    it('인증 성공 시 토큰 쌍을 반환한다', async () => {
      mockUsersService.getUserForPasswordAuth.mockResolvedValue({ id: 'uid', email: 'u@u.com', passwordHash: 'hash' });
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      mockJwtService.sign.mockReturnValueOnce('access').mockReturnValueOnce('refresh');
      await expect(service.loginWithEmail('u@u.com', 'correct')).resolves.toEqual({
        accessToken: 'access',
        refreshToken: 'refresh',
      });
    });
  });

  describe('checkEmailDuplicate', () => {
    it('이메일이 존재하면 true를 반환한다', async () => {
      mockUsersService.getUserByEmail.mockResolvedValue({ id: 'uid', email: 'u@u.com' });
      await expect(service.checkEmailDuplicate('u@u.com')).resolves.toBe(true);
    });

    it('이메일이 존재하지 않으면 false를 반환한다', async () => {
      mockUsersService.getUserByEmail.mockResolvedValue(null);
      await expect(service.checkEmailDuplicate('new@u.com')).resolves.toBe(false);
    });
  });

  describe('loginWithGoogle', () => {
    const googlePayload = {
      sub: 'google-sub-001',
      email: 'g@u.com',
      emailVerified: true,
      name: '구글유저',
    };

    beforeEach(() => {
      mockGoogleAuthClient.verifyIdToken.mockResolvedValue(googlePayload);
      mockJwtService.sign.mockReturnValueOnce('access').mockReturnValueOnce('refresh');
    });

    it('이미 연결된 Google 계정이면 해당 유저로 토큰 쌍을 반환한다', async () => {
      mockUsersService.getUserByOAuth.mockResolvedValue({ id: 'uid', email: 'g@u.com' });

      await expect(service.loginWithGoogle('id-token')).resolves.toEqual({ accessToken: 'access', refreshToken: 'refresh' });
      expect(mockUsersService.linkOAuthAccount).not.toHaveBeenCalled();
      expect(mockUsersService.createUserWithGoogle).not.toHaveBeenCalled();
    });

    it('동일 이메일의 활성 유저가 있으면 자동 연결 후 로그인한다', async () => {
      mockUsersService.getUserByOAuth.mockResolvedValue(null);
      mockUsersService.getUserForOAuthLink.mockResolvedValue({ id: 'uid', email: 'g@u.com', deletedAt: null });

      await expect(service.loginWithGoogle('id-token')).resolves.toEqual({ accessToken: 'access', refreshToken: 'refresh' });
      expect(mockUsersService.linkOAuthAccount).toHaveBeenCalledWith('uid', 'GOOGLE', 'google-sub-001', 'g@u.com', mockTransactionClient);
      expect(mockUsersService.createUserWithGoogle).not.toHaveBeenCalled();
    });

    it('연결도 이메일 일치도 없으면 Google 이름을 닉네임으로 신규 유저를 생성한다', async () => {
      mockUsersService.getUserByOAuth.mockResolvedValue(null);
      mockUsersService.getUserForOAuthLink.mockResolvedValue(null);
      mockUsersService.createUserWithGoogle.mockResolvedValue({ id: 'new-uid', email: 'g@u.com' });

      await expect(service.loginWithGoogle('id-token')).resolves.toEqual({ accessToken: 'access', refreshToken: 'refresh' });
      expect(mockUsersService.createUserWithGoogle).toHaveBeenCalledWith(
        { provider: 'GOOGLE', providerUserId: 'google-sub-001', email: 'g@u.com', nickname: '구글유저' },
        mockTransactionClient,
      );
    });

    it('Google 이름이 없으면 이메일 앞부분을 닉네임으로 쓴다', async () => {
      mockGoogleAuthClient.verifyIdToken.mockResolvedValue({ ...googlePayload, name: null });
      mockUsersService.getUserByOAuth.mockResolvedValue(null);
      mockUsersService.getUserForOAuthLink.mockResolvedValue(null);
      mockUsersService.createUserWithGoogle.mockResolvedValue({ id: 'new-uid', email: 'g@u.com' });

      await service.loginWithGoogle('id-token');

      expect(mockUsersService.createUserWithGoogle).toHaveBeenCalledWith(expect.objectContaining({ nickname: 'g' }), mockTransactionClient);
    });

    it('유효하지 않은 ID 토큰이면 UnauthorizedException을 던진다', async () => {
      mockGoogleAuthClient.verifyIdToken.mockRejectedValue(new UnauthorizedException('유효하지 않은 Google 토큰입니다.'));

      await expect(service.loginWithGoogle('bad-token')).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('이메일 미인증 Google 계정이면 UnauthorizedException을 던진다', async () => {
      mockGoogleAuthClient.verifyIdToken.mockResolvedValue({ ...googlePayload, emailVerified: false });

      await expect(service.loginWithGoogle('id-token')).rejects.toThrow('이메일 인증이 완료되지 않은 Google 계정입니다.');
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('탈퇴한 유저의 이메일이면 UnauthorizedException을 던진다', async () => {
      mockUsersService.getUserByOAuth.mockResolvedValue(null);
      mockUsersService.getUserForOAuthLink.mockResolvedValue({ id: 'uid', email: 'g@u.com', deletedAt: new Date() });

      await expect(service.loginWithGoogle('id-token')).rejects.toThrow('탈퇴한 계정입니다.');
      expect(mockUsersService.linkOAuthAccount).not.toHaveBeenCalled();
    });

    it('조회와 연결을 같은 transaction client로 실행한다', async () => {
      mockUsersService.getUserByOAuth.mockResolvedValue(null);
      mockUsersService.getUserForOAuthLink.mockResolvedValue({ id: 'uid', email: 'g@u.com', deletedAt: null });

      await service.loginWithGoogle('id-token');

      expect(mockUsersService.getUserByOAuth).toHaveBeenCalledWith('GOOGLE', 'google-sub-001', mockTransactionClient);
      expect(mockUsersService.getUserForOAuthLink).toHaveBeenCalledWith('g@u.com', mockTransactionClient);
      expect(mockUsersService.linkOAuthAccount).toHaveBeenCalledWith('uid', 'GOOGLE', 'google-sub-001', 'g@u.com', mockTransactionClient);
    });

    it('외부 tx가 전달되면 새 transaction을 열지 않고 그대로 전달한다', async () => {
      const externalTx = { external: true } as unknown as Prisma.TransactionClient;
      mockUsersService.getUserByOAuth.mockResolvedValue({ id: 'uid', email: 'g@u.com' });

      await service.loginWithGoogle('id-token', externalTx);

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
      expect(mockUsersService.getUserByOAuth).toHaveBeenCalledWith('GOOGLE', 'google-sub-001', externalTx);
    });
  });

  describe('registerWithEmail', () => {
    it('비밀번호를 해싱하고 토큰 쌍을 반환한다', async () => {
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed');
      mockUsersService.createUserWithEmail.mockResolvedValue({ id: 'new-uid', email: 'new@u.com' });
      mockJwtService.sign.mockReturnValueOnce('access').mockReturnValueOnce('refresh');

      const result = await service.registerWithEmail('new@u.com', 'pw', '홍길동');
      expect(bcrypt.hash).toHaveBeenCalledWith('pw', 10);
      expect(result).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
    });

    it('이름을 닉네임으로 usersService에 전달한다', async () => {
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed');
      mockUsersService.createUserWithEmail.mockResolvedValue({ id: 'new-uid', email: 'new@u.com' });
      mockJwtService.sign.mockReturnValueOnce('access').mockReturnValueOnce('refresh');

      await service.registerWithEmail('new@u.com', 'pw', '홍길동');

      expect(mockUsersService.createUserWithEmail).toHaveBeenCalledWith('new@u.com', 'hashed', '홍길동', undefined);
    });

    it('외부 tx가 전달되면 usersService에 동일한 tx를 전달한다', async () => {
      jest.spyOn(bcrypt, 'hash').mockImplementation(async () => 'hashed');
      mockUsersService.createUserWithEmail.mockResolvedValue({ id: 'new-uid', email: 'new@u.com' });
      mockJwtService.sign.mockReturnValueOnce('access').mockReturnValueOnce('refresh');
      const tx = {} as Prisma.TransactionClient;

      await service.registerWithEmail('new@u.com', 'pw', '홍길동', tx);

      expect(mockUsersService.createUserWithEmail).toHaveBeenCalledWith('new@u.com', 'hashed', '홍길동', tx);
    });
  });
});
