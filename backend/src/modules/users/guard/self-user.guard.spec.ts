import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { SelfUserGuard } from './self-user.guard';

const createContext = (userId: string, paramUserId: string) => {
  const request = { user: { id: userId }, params: { userId: paramUserId } };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
};

describe('SelfUserGuard', () => {
  let guard: SelfUserGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({ providers: [SelfUserGuard] }).compile();
    guard = module.get(SelfUserGuard);
  });

  it('req.user.id와 params.userId가 같으면 true를 반환한다', () => {
    const ctx = createContext('user-001', 'user-001');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('req.user.id와 params.userId가 다르면 ForbiddenException을 던진다', () => {
    const ctx = createContext('user-001', 'user-002');
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
