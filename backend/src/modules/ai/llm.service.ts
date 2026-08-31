import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

import { LLM_PROVIDERS, type LlmProvider } from './providers/llm-provider';
import type { LlmStructuredRequest } from './types/llm-request.type';
import type { LlmStructuredResponse } from './types/llm-response.type';
import { type AiConfig, getAiConfig } from './ai.config';
import { LlmRateLimitError, LlmUnavailableError } from './llm.errors';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly config: AiConfig;

  constructor(@Inject(LLM_PROVIDERS) private readonly providers: LlmProvider[]) {
    this.config = getAiConfig();
  }

  /**
   * 등록된 provider를 우선순위대로 시도해 구조화 응답을 얻는다.
   * 일시 오류는 같은 provider로 backoff 재시도하고, 호출량 제한은 즉시 다음 provider로 넘긴다.
   *
   * @param {LlmStructuredRequest} request - 시스템 지시문, 사용자 질문, 응답 스키마
   * @returns {Promise<LlmStructuredResponse>} 가장 먼저 성공한 provider의 응답
   */
  async generateStructured(request: LlmStructuredRequest): Promise<LlmStructuredResponse> {
    if (this.providers.length === 0) {
      throw new ServiceUnavailableException('사용 가능한 AI provider가 설정되지 않았습니다.');
    }

    for (const provider of this.providers) {
      const response = await this.tryProvider(provider, request);

      if (response !== null) {
        return response;
      }
    }

    throw new ServiceUnavailableException('AI 응답을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }

  /**
   * provider 하나를 재시도 정책에 따라 호출한다.
   * 이 provider로는 더 시도할 의미가 없다고 판단되면 null을 돌려 호출자가 다음 provider로 넘어가게 한다.
   *
   * @param {LlmProvider} provider - 호출할 provider
   * @param {LlmStructuredRequest} request - 생성 요청
   * @returns {Promise<LlmStructuredResponse | null>} 성공 응답, 실패 시 null
   */
  private async tryProvider(provider: LlmProvider, request: LlmStructuredRequest): Promise<LlmStructuredResponse | null> {
    for (let attempt = 0; attempt <= this.config.maxRetriesPerProvider; attempt += 1) {
      try {
        return await provider.generateStructured(request, this.config.requestTimeoutMs);
      } catch (error) {
        if (error instanceof LlmRateLimitError) {
          this.logger.warn(`[${provider.name}] 호출량 제한으로 다음 provider로 전환합니다.`);
          return null;
        }

        if (error instanceof LlmUnavailableError && attempt < this.config.maxRetriesPerProvider) {
          const delayMs = this.calculateBackoffDelay(attempt);
          this.logger.warn(`[${provider.name}] 일시 오류로 ${delayMs}ms 후 재시도합니다. (${attempt + 1}/${this.config.maxRetriesPerProvider})`);
          await delay(delayMs);
          continue;
        }

        this.logger.warn(`[${provider.name}] 호출에 실패해 다음 provider로 전환합니다: ${toMessage(error)}`);
        return null;
      }
    }

    return null;
  }

  /**
   * 지수 백오프에 jitter를 더해 재시도가 한 시점에 몰리지 않게 한다.
   *
   * @param {number} attempt - 0부터 시작하는 시도 회차
   * @returns {number} 대기할 밀리초
   */
  private calculateBackoffDelay(attempt: number): number {
    const exponential = this.config.retryBaseDelayMs * 2 ** attempt;

    return exponential + Math.floor(Math.random() * this.config.retryBaseDelayMs);
  }
}

/**
 * 재시도 사이 대기.
 *
 * @param {number} milliseconds - 대기 시간
 * @returns {Promise<void>} 대기 완료
 */
function delay(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
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
