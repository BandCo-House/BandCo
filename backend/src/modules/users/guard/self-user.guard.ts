import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { User } from 'src/generated/prisma';

@Injectable()
export class SelfUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user: User; params: { userId: string } }>();
    if (req.user.id !== req.params.userId) {
      throw new ForbiddenException('본인 프로필만 수정할 수 있습니다.');
    }
    return true;
  }
}
