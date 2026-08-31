import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

interface RateLimitRequest {
  user?: {
    id?: unknown;
  };
}

@Injectable()
export class AssistantRateLimitGuard extends ThrottlerGuard {
  /** AccessTokenGuard가 넣은 사용자 ID를 기준으로 질문 횟수를 집계한다. */
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const userId = resolveAuthenticatedUserId(req);

    if (userId !== null) {
      return `user:${userId}`;
    }

    return super.getTracker(req);
  }
}

/** 인증 Guard와의 연결 계약을 별도 함수로 두어 사용자별 제한 기준을 검증할 수 있게 한다. */
export function resolveAuthenticatedUserId(request: RateLimitRequest): string | null {
  const userId = request.user?.id;

  return typeof userId === 'string' && userId !== '' ? userId : null;
}
