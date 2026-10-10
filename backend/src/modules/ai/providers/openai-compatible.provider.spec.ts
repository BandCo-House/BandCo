import { LlmOutputTruncatedError } from '../llm.errors';

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
});
