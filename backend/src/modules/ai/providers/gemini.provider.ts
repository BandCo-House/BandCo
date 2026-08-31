import type { LlmProviderConfig } from '../ai.config';
import { LlmInvalidOutputError, LlmRateLimitError, LlmRequestError, LlmUnavailableError } from '../llm.errors';
import type { JsonSchema } from '../types/json-schema.type';
import type { LlmStructuredRequest } from '../types/llm-request.type';
import type { LlmStructuredResponse } from '../types/llm-response.type';

import type { LlmProvider } from './llm-provider';

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MAX_OUTPUT_TOKENS = 1024;

interface GeminiGenerateContentResponse {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

/**
 * Gemini의 responseMimeType + responseSchema를 사용해 JSON 출력을 강제한다.
 * 프롬프트로 "JSON만 출력해"라고 요청하는 방식보다 파싱 실패가 줄어 재시도 비용이 낮다.
 */
export class GeminiProvider implements LlmProvider {
  readonly name: string;
  readonly model: string;

  private readonly apiKey: string;

  constructor(config: LlmProviderConfig) {
    this.name = config.name;
    this.model = config.model;
    this.apiKey = config.apiKey;
  }

  /**
   * 구조화 응답을 생성한다. 사용자 질문은 systemInstruction과 분리해 전달한다.
   *
   * @param {LlmStructuredRequest} request - 시스템 지시문, 사용자 질문, 응답 스키마
   * @param {number} timeoutMs - 응답 대기 상한
   * @returns {Promise<LlmStructuredResponse>} 파싱된 응답과 호출 메타데이터
   */
  async generateStructured(request: LlmStructuredRequest, timeoutMs: number): Promise<LlmStructuredResponse> {
    const startedAt = Date.now();
    const response = await this.requestGenerateContent(request, timeoutMs);

    if (!response.ok) {
      throw this.createErrorFromStatus(response.status, await this.readErrorBody(response));
    }

    const body = (await response.json()) as GeminiGenerateContentResponse;
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text === undefined || text.trim() === '') {
      throw new LlmInvalidOutputError(this.name, 'Gemini 응답 본문이 비어 있습니다.');
    }

    return {
      parsed: this.parseJson(text),
      providerName: this.name,
      modelName: this.model,
      usage: {
        inputTokens: body.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: body.usageMetadata?.candidatesTokenCount ?? 0,
      },
      latencyMs: Date.now() - startedAt,
    };
  }

  /**
   * generateContent 엔드포인트를 호출한다. 타임아웃은 AbortSignal로 강제한다.
   *
   * @param {LlmStructuredRequest} request - 생성 요청
   * @param {number} timeoutMs - 응답 대기 상한
   * @returns {Promise<Response>} fetch 응답
   */
  private async requestGenerateContent(request: LlmStructuredRequest, timeoutMs: number): Promise<Response> {
    const url = `${GEMINI_API_BASE_URL}/${this.model}:generateContent`;

    try {
      return await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: request.systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: request.userMessage }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: toGeminiSchema(request.responseSchema),
            // 같은 질문이 같은 계획으로 변환돼야 캐시와 회귀 테스트가 성립한다.
            temperature: 0,
            maxOutputTokens: request.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      throw new LlmUnavailableError(this.name, `Gemini 호출에 실패했습니다: ${toMessage(error)}`);
    }
  }

  /**
   * HTTP 상태를 재시도 정책이 구분할 수 있는 오류로 변환한다.
   *
   * @param {number} status - 응답 상태 코드
   * @param {string} detail - 응답 본문 요약
   * @returns {Error} 상태에 대응하는 LLM 오류
   */
  private createErrorFromStatus(status: number, detail: string): Error {
    if (status === 429) {
      return new LlmRateLimitError(this.name, `Gemini 호출량 제한에 걸렸습니다: ${detail}`);
    }

    if (status >= 500) {
      return new LlmUnavailableError(this.name, `Gemini 서버 오류입니다: ${detail}`);
    }

    return new LlmRequestError(this.name, `Gemini 요청이 거부되었습니다: ${detail}`);
  }

  /**
   * 오류 응답 본문을 로그에 남길 수 있는 길이로 줄인다.
   *
   * @param {Response} response - 실패한 fetch 응답
   * @returns {Promise<string>} 잘라낸 본문 문자열
   */
  private async readErrorBody(response: Response): Promise<string> {
    try {
      return (await response.text()).slice(0, 300);
    } catch {
      return `status ${response.status}`;
    }
  }

  /**
   * 스키마를 강제해도 파싱 실패가 완전히 사라지지는 않아 별도 오류로 구분한다.
   *
   * @param {string} text - 모델이 반환한 JSON 문자열
   * @returns {unknown} 파싱 결과
   */
  private parseJson(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      throw new LlmInvalidOutputError(this.name, 'Gemini 응답을 JSON으로 파싱하지 못했습니다.');
    }
  }
}

/**
 * Gemini의 responseSchema는 OpenAPI 3.0 부분집합이라 지원하지 않는 키를 넘기면 400을 돌려준다.
 * 공통 스키마에서 Gemini가 이해하는 키만 남긴다.
 *
 * @param {JsonSchema} schema - provider 중립 스키마
 * @returns {Record<string, unknown>} Gemini responseSchema 형식
 */
function toGeminiSchema(schema: JsonSchema): Record<string, unknown> {
  const converted: Record<string, unknown> = { type: schema.type.toUpperCase() };

  if (schema.description !== undefined) converted.description = schema.description;
  if (schema.nullable !== undefined) converted.nullable = schema.nullable;

  // Gemini는 열거형을 STRING + format: 'enum'으로 표현해야 값 목록을 강제한다.
  if (schema.enum !== undefined) {
    converted.enum = schema.enum;
    converted.format = 'enum';
  }
  if (schema.required !== undefined) converted.required = schema.required;
  if (schema.items !== undefined) converted.items = toGeminiSchema(schema.items);

  if (schema.properties !== undefined) {
    const properties: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(schema.properties)) {
      properties[key] = toGeminiSchema(value);
    }

    converted.properties = properties;
    // 응답 키 순서를 고정해야 프롬프트 캐싱과 회귀 비교가 안정적이다.
    converted.propertyOrdering = Object.keys(schema.properties);
  }

  return converted;
}

/**
 * 알 수 없는 예외에서 로그용 메시지를 뽑는다.
 *
 * @param {unknown} error - 발생한 예외
 * @returns {string} 메시지 문자열
 */
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
