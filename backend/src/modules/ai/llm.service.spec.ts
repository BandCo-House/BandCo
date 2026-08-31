import { ServiceUnavailableException } from '@nestjs/common';

import type { LlmProvider } from './providers/llm-provider';
import type { LlmStructuredResponse } from './types/llm-response.type';
import { LlmRateLimitError, LlmRequestError, LlmUnavailableError } from './llm.errors';
import { LlmService } from './llm.service';

describe('LlmService', () => {
  const createResponse = (providerName: string): LlmStructuredResponse => ({
    parsed: { entity: 'schedule' },
    providerName,
    modelName: 'test-model',
    usage: { inputTokens: 10, outputTokens: 5 },
    latencyMs: 1,
  });

  const createProvider = (name: string): jest.Mocked<LlmProvider> =>
    ({
      name,
      model: 'test-model',
      generateStructured: jest.fn(),
    }) as unknown as jest.Mocked<LlmProvider>;

  const request = {
    systemInstruction: 'system',
    userMessage: 'question',
    responseSchema: { type: 'object' as const },
  };

  beforeAll(() => {
    // 재시도 대기 때문에 테스트가 느려지지 않도록 백오프 기준값을 줄인다.
    process.env.LLM_RETRY_BASE_DELAY_MS = '1';
    process.env.LLM_MAX_RETRIES = '2';
  });

  it('첫 provider가 성공하면 다음 provider를 호출하지 않는다', async () => {
    const primary = createProvider('gemini');
    const secondary = createProvider('openai');
    primary.generateStructured.mockResolvedValue(createResponse('gemini'));

    const response = await new LlmService([primary, secondary]).generateStructured(request);

    expect(response.providerName).toBe('gemini');
    expect(secondary.generateStructured).not.toHaveBeenCalled();
  });

  it('호출량 제한이면 재시도 없이 다음 provider로 넘어간다', async () => {
    const primary = createProvider('gemini');
    const secondary = createProvider('openai');
    primary.generateStructured.mockRejectedValue(new LlmRateLimitError('gemini', '한도 초과'));
    secondary.generateStructured.mockResolvedValue(createResponse('openai'));

    const response = await new LlmService([primary, secondary]).generateStructured(request);

    expect(response.providerName).toBe('openai');
    expect(primary.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('일시 오류는 같은 provider로 재시도한 뒤 성공을 반환한다', async () => {
    const primary = createProvider('gemini');
    primary.generateStructured.mockRejectedValueOnce(new LlmUnavailableError('gemini', '5xx')).mockResolvedValue(createResponse('gemini'));

    const response = await new LlmService([primary]).generateStructured(request);

    expect(response.providerName).toBe('gemini');
    expect(primary.generateStructured).toHaveBeenCalledTimes(2);
  });

  it('요청 자체가 잘못된 오류는 재시도하지 않고 다음 provider로 넘어간다', async () => {
    const primary = createProvider('gemini');
    const secondary = createProvider('openai');
    primary.generateStructured.mockRejectedValue(new LlmRequestError('gemini', '인증 실패'));
    secondary.generateStructured.mockResolvedValue(createResponse('openai'));

    const response = await new LlmService([primary, secondary]).generateStructured(request);

    expect(response.providerName).toBe('openai');
    expect(primary.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('모든 provider가 실패하면 503으로 실패한다', async () => {
    const primary = createProvider('gemini');
    const secondary = createProvider('openai');
    primary.generateStructured.mockRejectedValue(new LlmRateLimitError('gemini', '한도 초과'));
    secondary.generateStructured.mockRejectedValue(new LlmRateLimitError('openai', '한도 초과'));

    await expect(new LlmService([primary, secondary]).generateStructured(request)).rejects.toThrow(ServiceUnavailableException);
  });

  it('설정된 provider가 없으면 503으로 실패한다', async () => {
    await expect(new LlmService([]).generateStructured(request)).rejects.toThrow(ServiceUnavailableException);
  });
});
