import { LlmInvalidOutputError, LlmOutputTruncatedError } from '../llm.errors';

import { OpenAiCompatibleProvider } from './openai-compatible.provider';

const request = {
  systemInstruction: 'system',
  userMessage: 'question',
  responseSchema: { type: 'object' as const },
  maxOutputTokens: 1_500,
};

const provider = new OpenAiCompatibleProvider({
  kind: 'openai-compatible',
  name: 'openai',
  apiKey: 'test-key',
  model: 'gpt-test',
  baseUrl: 'https://api.example.com/v1',
});

describe('OpenAiCompatibleProvider', () => {
  afterEach(() => jest.restoreAllMocks());

  it('finish_reason이 length인 응답은 출력 토큰 한도 초과 오류로 구분한다', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: '{"status":"QUERY","sql":"SELECT' }, finish_reason: 'length' }] }), {
        status: 200,
      }),
    );

    await expect(provider.generateStructured(request, 1_000)).rejects.toMatchObject({
      constructor: LlmOutputTruncatedError,
      maxOutputTokens: 1_500,
    });
  });

  it('content가 null인 거절 응답은 TypeError 대신 거절 사유를 담은 출력 오류로 구분한다', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: null, refusal: '요청을 처리할 수 없습니다.' }, finish_reason: 'stop' }] }), {
        status: 200,
      }),
    );

    await expect(provider.generateStructured(request, 1_000)).rejects.toMatchObject({
      constructor: LlmInvalidOutputError,
      message: expect.stringContaining('요청을 처리할 수 없습니다.'),
    });
  });
});
