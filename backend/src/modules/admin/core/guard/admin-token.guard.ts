import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { AdminAuthService } from '../admin-auth.service';
import type { AdminTokenPayload } from '../types/admin-principal.type';

const BEARER_PREFIX = 'Bearer';

/**
 * 어드민 토큰을 검증하고 req.admin에 인증된 어드민을 담는다.
 * 서비스 유저 가드(BearerTokenGuard)와 시크릿·조회 테이블이 모두 달라 서로의 토큰을 받지 않는다.
 * 생성자 주입 메타데이터가 하위 가드로 상속되도록 추상 클래스에도 @Injectable()을 붙인다.
 */
@Injectable()
abstract class AdminTokenGuard implements CanActivate {
  protected abstract readonly expectedType: AdminTokenPayload['type'];

  constructor(private readonly adminAuthService: AdminAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const rawToken: unknown = req.headers['authorization'];

    if (typeof rawToken !== 'string' || rawToken.length === 0) {
      throw new UnauthorizedException('토큰이 없습니다.');
    }

    const [prefix, token, ...rest] = rawToken.split(' ');
    if (prefix !== BEARER_PREFIX || !token || rest.length > 0) {
      throw new UnauthorizedException('길이 또는 prefix가 잘못된 토큰 형식입니다.');
    }

    const payload = this.adminAuthService.verifyToken(token, this.expectedType);
    const admin = await this.adminAuthService.getActivePrincipal(payload.sub, payload.iat);
    if (admin === null) {
      throw new UnauthorizedException('세션이 만료되었습니다. 다시 로그인해 주세요.');
    }

    req.admin = admin;
    return true;
  }
}

@Injectable()
export class AdminAccessTokenGuard extends AdminTokenGuard {
  protected readonly expectedType = 'access';
}

@Injectable()
export class AdminRefreshTokenGuard extends AdminTokenGuard {
  protected readonly expectedType = 'refresh';
}
