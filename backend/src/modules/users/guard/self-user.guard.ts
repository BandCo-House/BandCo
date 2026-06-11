import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class SelfUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // AccessTokenGuard가 세팅한 req.user(id, email)를 받아 본인 여부만 검사한다.
    const req = context.switchToHttp().getRequest<{ user: { id: string }; params: { userId: string } }>();
    if (req.user.id !== req.params.userId) {
      throw new ForbiddenException('본인 프로필만 수정할 수 있습니다.');
    }
    return true;
  }
}
