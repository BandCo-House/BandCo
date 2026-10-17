export interface AssistantRateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export const ASSISTANT_RATE_LIMIT_NAME = 'assistant-query';

const DEFAULT_WINDOW_MS = 5 * 60 * 1_000;
const DEFAULT_MAX_REQUESTS = 10;

/** 자연어 질문 API의 사용자별 호출 제한 설정을 읽는다. */
export function getAssistantRateLimitConfig(environment: NodeJS.ProcessEnv = process.env): AssistantRateLimitConfig {
  return {
    windowMs: parsePositiveInteger(environment.ASSISTANT_RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS),
    maxRequests: parsePositiveInteger(environment.ASSISTANT_RATE_LIMIT_MAX, DEFAULT_MAX_REQUESTS),
  };
}

/** 잘못된 숫자 설정은 서비스 시작 실패 대신 검토된 기본값으로 되돌린다. */
function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
