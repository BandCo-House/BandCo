import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { AuthService } from '../auth.service';

import { BasicTokenGuard } from './basic-token.guard';

const mockAuthService = {
  extractTokenFromHeader: jest.fn(),
  decodeBasicToken: jest.fn(),
  authenticateWithEmailAndPassword: jest.fn(),
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

describe('BasicTokenGuard', () => {
  let guard: BasicTokenGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BasicTokenGuard, { provide: AuthService, useValue: mockAuthService }],
    }).compile();

    guard = module.get<BasicTokenGuard>(BasicTokenGuard);
    jest.clearAllMocks();
  });

  it('authorization 헤더가 없으면 UnauthorizedException을 던진다', async () => {
    const { ctx } = createContext();
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('인증 성공 시 req.user에 유저를 설정하고 true를 반환한다', async () => {
    const { ctx, request } = createContext('Basic encoded');
    mockAuthService.extractTokenFromHeader.mockReturnValue('encoded');
    mockAuthService.decodeBasicToken.mockReturnValue({ email: 'u@u.com', password: 'pw' });
    mockAuthService.authenticateWithEmailAndPassword.mockResolvedValue({ id: 'uid', email: 'u@u.com' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(request.user).toEqual({ id: 'uid', email: 'u@u.com' });
    expect(mockAuthService.extractTokenFromHeader).toHaveBeenCalledWith('Basic encoded', false);
  });
});
