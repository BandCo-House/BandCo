import { resolveAuthenticatedUserId } from './assistant-rate-limit.guard';

describe('resolveAuthenticatedUserId', () => {
  it('인증 사용자의 ID를 rate limit 기준으로 반환한다', () => {
    expect(resolveAuthenticatedUserId({ user: { id: 'user-1' } })).toBe('user-1');
  });

  it('인증 정보가 없거나 ID가 문자열이 아니면 fallback을 위해 null을 반환한다', () => {
    expect(resolveAuthenticatedUserId({})).toBeNull();
    expect(resolveAuthenticatedUserId({ user: { id: 1 } })).toBeNull();
  });
});
