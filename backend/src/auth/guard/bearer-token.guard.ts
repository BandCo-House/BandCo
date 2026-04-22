import { CanActivate, UnauthorizedException, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { MembersService } from 'src/modules/members/members.service';

@Injectable()
export class bearerTokenGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly memberService: MembersService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const rawToken = req.headers['authorization'];

    if (!rawToken) {
      throw new UnauthorizedException('토큰이 없습니다.');
    }
    const token = this.authService.extractTokenFromHeader(rawToken, true);
    const result = await this.authService.verifyToken(token);
    const user = await this.memberService.getUserByEmail(result.email);
    req.token = token;
    req.tokenType = result.type;
    req.user = user;
    return true;
  }
}

@Injectable()
export class AccessTokenGuard extends bearerTokenGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const req = context.switchToHttp().getRequest();
    if (req.tokenType !== 'access') {
      throw new UnauthorizedException('액세스 토큰이 아닙니다.');
    }
    return true;
  }
}

@Injectable()
export class RefreshTokenGuard extends bearerTokenGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const req = context.switchToHttp().getRequest();
    if (req.tokenType !== 'refresh') {
      throw new UnauthorizedException('리프레시 토큰이 아닙니다.');
    }
    return true;
  }
}
