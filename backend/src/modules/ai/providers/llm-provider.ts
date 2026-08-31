import type { LlmStructuredRequest } from '../types/llm-request.type';
import type { LlmStructuredResponse } from '../types/llm-response.type';

export const LLM_PROVIDERS = Symbol('LLM_PROVIDERS');

/**
 * provider 교체와 fallback이 잦을 것으로 보고, 호출부가 알아야 하는 표면을 이 한 개로 제한한다.
 * 구현체는 실패를 llm.errors의 4종 중 하나로 변환할 책임을 진다.
 */
export interface LlmProvider {
  readonly name: string;
  readonly model: string;

  /**
   * 스키마를 강제한 구조화 응답을 생성한다.
   *
   * @param {LlmStructuredRequest} request - 시스템 지시문, 사용자 질문, 응답 스키마
   * @param {number} timeoutMs - 이 시간을 넘기면 LlmUnavailableError로 중단한다
   * @returns {Promise<LlmStructuredResponse>} 파싱된 응답과 호출 메타데이터
   */
  generateStructured(request: LlmStructuredRequest, timeoutMs: number): Promise<LlmStructuredResponse>;
}
