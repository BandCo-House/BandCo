import { getAiConfig } from './ai.config';

describe('getAiConfig', () => {
  it('순환 토글은 설정하지 않으면 모두 비활성화한다', () => {
    const config = getAiConfig({ GEMINI_API_KEY: 'primary-key' });

    expect(config.keyRotationEnabled).toBe(false);
    expect(config.providerRotationEnabled).toBe(false);
  });

  it('기존 단일 key와 복수 key를 입력 순서대로 합치고 중복을 제거한다', () => {
    const config = getAiConfig({
      GEMINI_API_KEY: 'primary-key',
      GEMINI_API_KEYS: 'secondary-key, primary-key, third-key',
    });

    expect(config.providerGroups[0].credentials.map(credential => credential.apiKey)).toEqual(['primary-key', 'secondary-key', 'third-key']);
  });

  it('provider 선언 순서와 독립 토글 설정을 유지한다', () => {
    const config = getAiConfig({
      LLM_PROVIDERS: 'gemini,openai',
      LLM_KEY_ROTATION_ENABLED: 'true',
      LLM_PROVIDER_ROTATION_ENABLED: 'TRUE',
      GEMINI_API_KEY: 'gemini-key',
      OPENAI_API_KEY: 'openai-key',
      OPENAI_MODEL: 'openai-model',
    });

    expect(config.providerGroups.map(group => group.name)).toEqual(['gemini', 'openai']);
    expect(config.keyRotationEnabled).toBe(true);
    expect(config.providerRotationEnabled).toBe(true);
  });

  it('API key나 model이 불완전한 provider는 등록하지 않는다', () => {
    const config = getAiConfig({
      LLM_PROVIDERS: 'gemini,openai',
      OPENAI_API_KEY: 'openai-key',
    });

    expect(config.providerGroups).toEqual([]);
  });
});
