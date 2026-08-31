import { ServiceUnavailableException } from '@nestjs/common';

import type { LlmProvider, LlmProviderGroup } from './providers/llm-provider';
import type { LlmStructuredResponse } from './types/llm-response.type';
import type { AiConfig } from './ai.config';
import { LlmRateLimitError, LlmRequestError, LlmUnavailableError } from './llm.errors';
import { LlmService } from './llm.service';

const request = {
  systemInstruction: 'system',
  userMessage: 'question',
  responseSchema: { type: 'object' as const },
};

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

const createGroup = (name: string, ...credentials: LlmProvider[]): LlmProviderGroup => ({ name, credentials });

const createConfig = (overrides: Partial<AiConfig> = {}): AiConfig => ({
  providerGroups: [],
  keyRotationEnabled: false,
  providerRotationEnabled: false,
  requestTimeoutMs: 15_000,
  maxRetriesPerProvider: 0,
  retryBaseDelayMs: 1,
  ...overrides,
});

describe('LlmService', () => {
  it('모든 순환 설정이 꺼져 있으면 첫 provider의 첫 credential만 사용한다', async () => {
    const firstCredential = createProvider('gemini');
    const secondCredential = createProvider('gemini');
    const secondaryProvider = createProvider('openai');
    firstCredential.generateStructured.mockResolvedValue(createResponse('gemini'));

    const service = new LlmService(
      [createGroup('gemini', firstCredential, secondCredential), createGroup('openai', secondaryProvider)],
      createConfig(),
    );
    const response = await service.generateStructured(request);

    expect(response.providerName).toBe('gemini');
    expect(firstCredential.generateStructured).toHaveBeenCalledTimes(1);
    expect(secondCredential.generateStructured).not.toHaveBeenCalled();
    expect(secondaryProvider.generateStructured).not.toHaveBeenCalled();
  });

  it('key rotation이 켜져 있으면 요청마다 시작 credential을 순환한다', async () => {
    const firstCredential = createProvider('gemini');
    const secondCredential = createProvider('gemini');
    firstCredential.generateStructured.mockResolvedValue(createResponse('gemini'));
    secondCredential.generateStructured.mockResolvedValue(createResponse('gemini'));

    const service = new LlmService([createGroup('gemini', firstCredential, secondCredential)], createConfig({ keyRotationEnabled: true }));

    await service.generateStructured(request);
    await service.generateStructured(request);

    expect(firstCredential.generateStructured).toHaveBeenCalledTimes(1);
    expect(secondCredential.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('key rotation이 켜져 있으면 첫 credential의 호출량 제한 후 같은 provider의 다음 credential을 사용한다', async () => {
    const firstCredential = createProvider('gemini');
    const secondCredential = createProvider('gemini');
    firstCredential.generateStructured.mockRejectedValue(new LlmRateLimitError('gemini', '한도 초과'));
    secondCredential.generateStructured.mockResolvedValue(createResponse('gemini'));

    const service = new LlmService([createGroup('gemini', firstCredential, secondCredential)], createConfig({ keyRotationEnabled: true }));
    const response = await service.generateStructured(request);

    expect(response.providerName).toBe('gemini');
    expect(firstCredential.generateStructured).toHaveBeenCalledTimes(1);
    expect(secondCredential.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('provider rotation이 꺼져 있으면 첫 provider 실패 후 다음 provider를 호출하지 않는다', async () => {
    const primary = createProvider('gemini');
    const secondary = createProvider('openai');
    primary.generateStructured.mockRejectedValue(new LlmRateLimitError('gemini', '한도 초과'));

    const service = new LlmService([createGroup('gemini', primary), createGroup('openai', secondary)], createConfig());

    await expect(service.generateStructured(request)).rejects.toThrow(ServiceUnavailableException);
    expect(secondary.generateStructured).not.toHaveBeenCalled();
  });

  it('provider rotation이 켜져 있으면 요청마다 시작 provider를 순환한다', async () => {
    const primary = createProvider('gemini');
    const secondary = createProvider('openai');
    primary.generateStructured.mockResolvedValue(createResponse('gemini'));
    secondary.generateStructured.mockResolvedValue(createResponse('openai'));

    const service = new LlmService(
      [createGroup('gemini', primary), createGroup('openai', secondary)],
      createConfig({ providerRotationEnabled: true }),
    );

    const firstResponse = await service.generateStructured(request);
    const secondResponse = await service.generateStructured(request);

    expect(firstResponse.providerName).toBe('gemini');
    expect(secondResponse.providerName).toBe('openai');
    expect(primary.generateStructured).toHaveBeenCalledTimes(1);
    expect(secondary.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('provider rotation이 켜져 있으면 시작 provider 실패 후 다음 provider를 사용한다', async () => {
    const primary = createProvider('gemini');
    const secondary = createProvider('openai');
    primary.generateStructured.mockRejectedValue(new LlmRateLimitError('gemini', '한도 초과'));
    secondary.generateStructured.mockResolvedValue(createResponse('openai'));

    const service = new LlmService(
      [createGroup('gemini', primary), createGroup('openai', secondary)],
      createConfig({ providerRotationEnabled: true }),
    );
    const response = await service.generateStructured(request);

    expect(response.providerName).toBe('openai');
    expect(primary.generateStructured).toHaveBeenCalledTimes(1);
    expect(secondary.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('일시 오류는 같은 credential로 재시도한 뒤 성공을 반환한다', async () => {
    const primary = createProvider('gemini');
    primary.generateStructured.mockRejectedValueOnce(new LlmUnavailableError('gemini', '5xx')).mockResolvedValue(createResponse('gemini'));

    const service = new LlmService([createGroup('gemini', primary)], createConfig({ maxRetriesPerProvider: 2 }));
    const response = await service.generateStructured(request);

    expect(response.providerName).toBe('gemini');
    expect(primary.generateStructured).toHaveBeenCalledTimes(2);
  });

  it('요청 오류도 key rotation이 켜져 있으면 다음 credential로 넘긴다', async () => {
    const firstCredential = createProvider('gemini');
    const secondCredential = createProvider('gemini');
    firstCredential.generateStructured.mockRejectedValue(new LlmRequestError('gemini', '인증 실패'));
    secondCredential.generateStructured.mockResolvedValue(createResponse('gemini'));

    const service = new LlmService([createGroup('gemini', firstCredential, secondCredential)], createConfig({ keyRotationEnabled: true }));
    const response = await service.generateStructured(request);

    expect(response.providerName).toBe('gemini');
    expect(secondCredential.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('사용 가능한 provider group이 없으면 503으로 실패한다', async () => {
    const service = new LlmService([], createConfig());

    await expect(service.generateStructured(request)).rejects.toThrow(ServiceUnavailableException);
  });
});
