import { type ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

interface RateLimitRequest {
  user?: {
    id?: unknown;
  };
}

interface QueryRequest {
  body?: unknown;
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

  /** 추천 질문은 모델을 호출하지 않아 비용이 들지 않으므로 질문 횟수에 넣지 않는다. */
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    return isPresetRequest(context.switchToHttp().getRequest<QueryRequest>());
  }
}

/** 인증 Guard와의 연결 계약을 별도 함수로 두어 사용자별 제한 기준을 검증할 수 있게 한다. */
export function resolveAuthenticatedUserId(request: RateLimitRequest): string | null {
  const userId = request.user?.id;

  return typeof userId === 'string' && userId !== '' ? userId : null;
}

/**
 * 서비스와 같은 기준으로 추천 질문 요청을 판별한다. presetId가 있으면 질문 문장이 함께 와도 고정 SQL로 처리된다.
 */
export function isPresetRequest(request: QueryRequest): boolean {
  const body = request.body;
  return typeof body === 'object' && body !== null && 'presetId' in body && body.presetId !== undefined;
}
