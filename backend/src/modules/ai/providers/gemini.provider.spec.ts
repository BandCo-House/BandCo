import { LlmInvalidOutputError, LlmOutputTruncatedError } from '../llm.errors';

import { GeminiProvider } from './gemini.provider';

const request = {
  systemInstruction: 'system',
  userMessage: 'question',
  responseSchema: { type: 'object' as const },
  maxOutputTokens: 1_500,
};

const provider = new GeminiProvider({ kind: 'gemini', name: 'gemini', apiKey: 'test-key', model: 'gemini-test' });

const mockGeminiResponse = (candidate: Record<string, unknown>) =>
  jest.spyOn(global, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ candidates: [candidate], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 1_500 } }), {
      status: 200,
    }),
  );

describe('GeminiProvider', () => {
  afterEach(() => jest.restoreAllMocks());

  it('출력 토큰 한도로 잘린 응답은 파싱 실패가 아니라 한도 초과 오류로 구분한다', async () => {
    mockGeminiResponse({ content: { parts: [{ text: '{"status":"QUERY","sql":"SELECT' }] }, finishReason: 'MAX_TOKENS' });

    const result = provider.generateStructured(request, 1_000);

    await expect(result).rejects.toBeInstanceOf(LlmOutputTruncatedError);
    await expect(result).rejects.toMatchObject({ maxOutputTokens: 1_500 });
  });

  it('정상 종료한 응답은 JSON으로 파싱하고, 잘리지 않은 깨진 JSON은 파싱 실패로 둔다', async () => {
    mockGeminiResponse({ content: { parts: [{ text: '{"status":"QUERY"}' }] }, finishReason: 'STOP' });
    await expect(provider.generateStructured(request, 1_000)).resolves.toMatchObject({ parsed: { status: 'QUERY' } });

    mockGeminiResponse({ content: { parts: [{ text: '{"status":' }] }, finishReason: 'STOP' });
    await expect(provider.generateStructured(request, 1_000)).rejects.toBeInstanceOf(LlmInvalidOutputError);
  });
});
