import { isPresetRequest, resolveAuthenticatedUserId } from './assistant-rate-limit.guard';

describe('resolveAuthenticatedUserId', () => {
  it('인증 사용자의 ID를 rate limit 기준으로 반환한다', () => {
    expect(resolveAuthenticatedUserId({ user: { id: 'user-1' } })).toBe('user-1');
  });

  it('인증 정보가 없거나 ID가 문자열이 아니면 fallback을 위해 null을 반환한다', () => {
    expect(resolveAuthenticatedUserId({})).toBeNull();
    expect(resolveAuthenticatedUserId({ user: { id: 1 } })).toBeNull();
  });
});

describe('isPresetRequest', () => {
  it('추천 질문 요청은 모델을 호출하지 않아 횟수 제한에서 뺀다', () => {
    expect(isPresetRequest({ body: { presetId: 'next-schedule' } })).toBe(true);
    // 서비스는 presetId가 있으면 질문 문장을 쓰지 않는다.
    expect(isPresetRequest({ body: { presetId: 'next-schedule', question: '아무 질문' } })).toBe(true);
  });

  it('자유 질문과 본문이 없는 요청은 횟수 제한을 적용한다', () => {
    expect(isPresetRequest({ body: { question: '다음 합주 언제야?' } })).toBe(false);
    expect(isPresetRequest({ body: { presetId: undefined, question: '질문' } })).toBe(false);
    expect(isPresetRequest({})).toBe(false);
  });
});
