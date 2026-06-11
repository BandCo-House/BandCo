import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/modules/users/users.service';

import { AuthService } from '../auth.service';

import { AccessTokenGuard, BearerTokenGuard, RefreshTokenGuard } from './bearer-token.guard';

const mockAuthService = {
  extractTokenFromHeader: jest.fn(),
  verifyToken: jest.fn(),
};

const mockUsersService = {
  getAuthUserById: jest.fn(),
};

const createContext = (authHeader?: string) => {
  const request: Record<string, unknown> = {
    headers: authHeader ? { authorization: authHeader } : {},
  };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { ctx, request };
};

const setupValidBearer = (tokenType: 'access' | 'refresh') => {
  mockAuthService.extractTokenFromHeader.mockReturnValue('token');
  mockAuthService.verifyToken.mockReturnValue({ id: 'uid', email: 'u@u.com', type: tokenType });
  mockUsersService.getAuthUserById.mockResolvedValue({ id: 'uid', email: 'u@u.com', passwordHash: 'hash' });
};

describe('BearerTokenGuard', () => {
  let guard: BearerTokenGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BearerTokenGuard, { provide: AuthService, useValue: mockAuthService }, { provide: UsersService, useValue: mockUsersService }],
    }).compile();

    guard = module.get<BearerTokenGuard>(BearerTokenGuard);
    jest.clearAllMocks();
  });

  it('authorization 헤더가 없으면 UnauthorizedException을 던진다', async () => {
    const { ctx } = createContext();
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('토큰의 유저가 존재하지 않으면 UnauthorizedException을 던진다', async () => {
    const { ctx } = createContext('Bearer token');
    mockAuthService.extractTokenFromHeader.mockReturnValue('token');
    mockAuthService.verifyToken.mockReturnValue({ id: 'ghost-id', email: 'ghost@u.com', type: 'access' });
    mockUsersService.getAuthUserById.mockResolvedValue(null);

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('인증 성공 시 req에 token, tokenType, user를 설정하고 true를 반환한다', async () => {
    const { ctx, request } = createContext('Bearer token');
    setupValidBearer('access');

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(request.token).toBe('token');
    expect(request.tokenType).toBe('access');
    expect(request.user).toEqual({ id: 'uid', email: 'u@u.com' });
    expect(mockUsersService.getAuthUserById).toHaveBeenCalledWith('uid');
  });
});

describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccessTokenGuard, { provide: AuthService, useValue: mockAuthService }, { provide: UsersService, useValue: mockUsersService }],
    }).compile();

    guard = module.get<AccessTokenGuard>(AccessTokenGuard);
    jest.clearAllMocks();
  });

  it('access 토큰이면 true를 반환한다', async () => {
    const { ctx } = createContext('Bearer token');
    setupValidBearer('access');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('refresh 토큰이면 UnauthorizedException을 던진다', async () => {
    const { ctx } = createContext('Bearer token');
    setupValidBearer('refresh');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});

describe('RefreshTokenGuard', () => {
  let guard: RefreshTokenGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefreshTokenGuard, { provide: AuthService, useValue: mockAuthService }, { provide: UsersService, useValue: mockUsersService }],
    }).compile();

    guard = module.get<RefreshTokenGuard>(RefreshTokenGuard);
    jest.clearAllMocks();
  });

  it('refresh 토큰이면 true를 반환한다', async () => {
    const { ctx } = createContext('Bearer token');
    setupValidBearer('refresh');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('access 토큰이면 UnauthorizedException을 던진다', async () => {
    const { ctx } = createContext('Bearer token');
    setupValidBearer('access');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
