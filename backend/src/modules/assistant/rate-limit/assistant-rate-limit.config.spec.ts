import { getAssistantRateLimitConfig } from './assistant-rate-limit.config';

describe('getAssistantRateLimitConfig', () => {
  it('설정이 없으면 사용자당 5분에 10회로 제한한다', () => {
    expect(getAssistantRateLimitConfig({})).toEqual({
      windowMs: 300_000,
      maxRequests: 10,
    });
  });

  it('양의 정수 환경 변수로 제한값을 변경한다', () => {
    expect(
      getAssistantRateLimitConfig({
        ASSISTANT_RATE_LIMIT_WINDOW_MS: '60000',
        ASSISTANT_RATE_LIMIT_MAX: '5',
      }),
    ).toEqual({
      windowMs: 60_000,
      maxRequests: 5,
    });
  });

  it('잘못된 환경 변수는 기본값으로 되돌린다', () => {
    expect(
      getAssistantRateLimitConfig({
        ASSISTANT_RATE_LIMIT_WINDOW_MS: '0',
        ASSISTANT_RATE_LIMIT_MAX: 'invalid',
      }),
    ).toEqual({
      windowMs: 300_000,
      maxRequests: 10,
    });
  });
});
