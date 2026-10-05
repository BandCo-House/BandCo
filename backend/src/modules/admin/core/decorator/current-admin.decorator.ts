import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { AdminPrincipal } from '../types/admin-principal.type';

/** AdminAccessTokenGuard가 req.admin에 담은 인증된 어드민을 꺼낸다. */
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AdminPrincipal => context.switchToHttp().getRequest().admin,
);
