import type { LlmProviderConfig } from '../ai.config';
import { LlmInvalidOutputError, LlmRateLimitError, LlmRequestError, LlmUnavailableError } from '../llm.errors';
import type { JsonSchema } from '../types/json-schema.type';
import type { LlmStructuredRequest } from '../types/llm-request.type';
import type { LlmStructuredResponse } from '../types/llm-response.type';

import type { LlmProvider } from './llm-provider';

const DEFAULT_MAX_OUTPUT_TOKENS = 1024;
const RESPONSE_SCHEMA_NAME = 'query_plan';

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

/**
 * OpenAI Chat Completions 규격을 따르는 provider를 하나의 구현으로 처리한다.
 * baseUrl만 바꾸면 GPT, Grok 등 같은 규격을 쓰는 서비스를 fallback 대상으로 추가할 수 있다.
 */
export class OpenAiCompatibleProvider implements LlmProvider {
  readonly name: string;
  readonly model: string;

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: LlmProviderConfig) {
    this.name = config.name;
    this.model = config.model;
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? '').replace(/\/$/, '');
  }

  /**
   * 구조화 응답을 생성한다.
   *
   * @param {LlmStructuredRequest} request - 시스템 지시문, 사용자 질문, 응답 스키마
   * @param {number} timeoutMs - 응답 대기 상한
   * @returns {Promise<LlmStructuredResponse>} 파싱된 응답과 호출 메타데이터
   */
  async generateStructured(request: LlmStructuredRequest, timeoutMs: number): Promise<LlmStructuredResponse> {
    const startedAt = Date.now();
    const response = await this.requestChatCompletion(request, timeoutMs);

    if (!response.ok) {
      throw this.createErrorFromStatus(response.status, await this.readErrorBody(response));
    }

    const body = (await response.json()) as ChatCompletionResponse;
    const content = body.choices?.[0]?.message?.content;

    if (content === undefined || content.trim() === '') {
      throw new LlmInvalidOutputError(this.name, `${this.name} 응답 본문이 비어 있습니다.`);
    }

    return {
      parsed: this.parseJson(content),
      providerName: this.name,
      modelName: this.model,
      usage: {
        inputTokens: body.usage?.prompt_tokens ?? 0,
        outputTokens: body.usage?.completion_tokens ?? 0,
      },
      latencyMs: Date.now() - startedAt,
    };
  }

  /**
   * chat/completions 엔드포인트를 호출한다.
   *
   * @param {LlmStructuredRequest} request - 생성 요청
   * @param {number} timeoutMs - 응답 대기 상한
   * @returns {Promise<Response>} fetch 응답
   */
  private async requestChatCompletion(request: LlmStructuredRequest, timeoutMs: number): Promise<Response> {
    try {
      return await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: request.systemInstruction },
            { role: 'user', content: request.userMessage },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: RESPONSE_SCHEMA_NAME,
              strict: true,
              schema: toStrictSchema(request.responseSchema),
            },
          },
          temperature: 0,
          max_tokens: request.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      throw new LlmUnavailableError(this.name, `${this.name} 호출에 실패했습니다: ${toMessage(error)}`);
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
      return new LlmRateLimitError(this.name, `${this.name} 호출량 제한에 걸렸습니다: ${detail}`);
    }

    if (status >= 500) {
      return new LlmUnavailableError(this.name, `${this.name} 서버 오류입니다: ${detail}`);
    }

    return new LlmRequestError(this.name, `${this.name} 요청이 거부되었습니다: ${detail}`);
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
   * 응답을 JSON으로 파싱한다.
   *
   * @param {string} content - 모델이 반환한 JSON 문자열
   * @returns {unknown} 파싱 결과
   */
  private parseJson(content: string): unknown {
    try {
      return JSON.parse(content);
    } catch {
      throw new LlmInvalidOutputError(this.name, `${this.name} 응답을 JSON으로 파싱하지 못했습니다.`);
    }
  }
}

/**
 * OpenAI strict 모드는 모든 프로퍼티가 required이고 additionalProperties가 false여야 한다.
 * 공통 스키마의 nullable은 union 타입으로 옮겨 "값이 없음"을 표현한다.
 *
 * @param {JsonSchema} schema - provider 중립 스키마
 * @returns {Record<string, unknown>} strict 모드에서 통과하는 스키마
 */
function toStrictSchema(schema: JsonSchema): Record<string, unknown> {
  const converted: Record<string, unknown> = {
    type: schema.nullable === true ? [schema.type, 'null'] : schema.type,
  };

  if (schema.description !== undefined) converted.description = schema.description;
  if (schema.items !== undefined) converted.items = toStrictSchema(schema.items);

  // union 타입으로 바뀐 열거형은 enum 목록에도 null이 있어야 strict 검증을 통과한다.
  if (schema.enum !== undefined) {
    converted.enum = schema.nullable === true ? [...schema.enum, null] : schema.enum;
  }

  if (schema.properties !== undefined) {
    const properties: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(schema.properties)) {
      properties[key] = toStrictSchema(value);
    }

    converted.properties = properties;
    converted.required = Object.keys(schema.properties);
    converted.additionalProperties = false;
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
