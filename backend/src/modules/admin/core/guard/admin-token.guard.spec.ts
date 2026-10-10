import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AdminAuthService } from '../admin-auth.service';
import type { AdminPrincipal, AdminTokenPayload } from '../types/admin-principal.type';

import { AdminRolesGuard } from './admin-roles.guard';
import { AdminAccessTokenGuard, AdminRefreshTokenGuard } from './admin-token.guard';

const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const PRINCIPAL: AdminPrincipal = { id: ADMIN_ID, email: 'admin@bandco.kr', name: '관리자', role: 'OPERATOR' };

function createContext(request: Record<string, unknown>, handler: () => void = () => undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => handler,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

// 토큰 검증은 AdminAuthService 테스트에서 다루므로 여기서는 토큰 문자열로 결과를 고정한다
function createAuthServiceStub(principal: AdminPrincipal | null): { service: AdminAuthService; verifyCalls: { token: string; type: string }[] } {
  const verifyCalls: { token: string; type: string }[] = [];
  const service = {
    verifyToken(token: string, expectedType: AdminTokenPayload['type']): AdminTokenPayload {
      verifyCalls.push({ token, type: expectedType });
      if (token === 'bad') throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      return { sub: ADMIN_ID, type: expectedType, scope: 'admin' };
    },
    async getActivePrincipal() {
      return principal;
    },
  } as unknown as AdminAuthService;
  return { service, verifyCalls };
}

describe('AdminAccessTokenGuard', () => {
  it('유효한 액세스 토큰이면 req.admin에 어드민을 담는다', async () => {
    const { service, verifyCalls } = createAuthServiceStub(PRINCIPAL);
    const request: Record<string, unknown> = { headers: { authorization: 'Bearer good' } };

    await expect(new AdminAccessTokenGuard(service).canActivate(createContext(request))).resolves.toBe(true);

    expect(request.admin).toEqual(PRINCIPAL);
    expect(verifyCalls).toEqual([{ token: 'good', type: 'access' }]);
  });

  it('Authorization 헤더가 없으면 UnauthorizedException을 던진다', async () => {
    const { service } = createAuthServiceStub(PRINCIPAL);

    await expect(new AdminAccessTokenGuard(service).canActivate(createContext({ headers: {} }))).rejects.toThrow('토큰이 없습니다.');
  });

  it('Bearer 형식이 아니면 UnauthorizedException을 던진다', async () => {
    const { service } = createAuthServiceStub(PRINCIPAL);

    await expect(new AdminAccessTokenGuard(service).canActivate(createContext({ headers: { authorization: 'Basic abc' } }))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('토큰 검증에 실패하면 예외를 그대로 전파한다', async () => {
    const { service } = createAuthServiceStub(PRINCIPAL);

    await expect(new AdminAccessTokenGuard(service).canActivate(createContext({ headers: { authorization: 'Bearer bad' } }))).rejects.toThrow(
      '유효하지 않은 토큰입니다.',
    );
  });

  it('비활성화된 어드민이면 UnauthorizedException을 던진다', async () => {
    const { service } = createAuthServiceStub(null);

    await expect(new AdminAccessTokenGuard(service).canActivate(createContext({ headers: { authorization: 'Bearer good' } }))).rejects.toThrow(
      '세션이 만료되었습니다. 다시 로그인해 주세요.',
    );
  });
});

describe('AdminRefreshTokenGuard', () => {
  it('리프레시 토큰 종류로 검증한다', async () => {
    const { service, verifyCalls } = createAuthServiceStub(PRINCIPAL);

    await new AdminRefreshTokenGuard(service).canActivate(createContext({ headers: { authorization: 'Bearer good' } }));

    expect(verifyCalls).toEqual([{ token: 'good', type: 'refresh' }]);
  });
});

describe('AdminRolesGuard', () => {
  const reflector = new Reflector();

  it('역할 지정이 없으면 모든 어드민을 통과시킨다', () => {
    const guard = new AdminRolesGuard(reflector);

    expect(guard.canActivate(createContext({ admin: PRINCIPAL }))).toBe(true);
  });

  it('SUPER_ADMIN 전용 핸들러에 OPERATOR가 접근하면 ForbiddenException을 던진다', () => {
    const handler = () => undefined;
    Reflect.defineMetadata('adminRoles', ['SUPER_ADMIN'], handler);
    const guard = new AdminRolesGuard(reflector);

    expect(() => guard.canActivate(createContext({ admin: PRINCIPAL }, handler))).toThrow(ForbiddenException);
  });

  it('SUPER_ADMIN 전용 핸들러에 SUPER_ADMIN은 통과한다', () => {
    const handler = () => undefined;
    Reflect.defineMetadata('adminRoles', ['SUPER_ADMIN'], handler);
    const guard = new AdminRolesGuard(reflector);

    expect(guard.canActivate(createContext({ admin: { ...PRINCIPAL, role: 'SUPER_ADMIN' } }, handler))).toBe(true);
  });
});
