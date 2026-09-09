import type { JsonSchema } from './json-schema.type';

/**
 * 구조화 출력 요청. 자유 텍스트 생성은 사용하지 않으므로 schema를 필수로 둔다.
 */
export interface LlmStructuredRequest {
  /** 모델 역할과 제약을 지정하는 시스템 지시문 */
  systemInstruction: string;
  /** 사용자 질문. 신뢰할 수 없는 입력으로 취급한다. */
  userMessage: string;
  /** 응답 강제 스키마 */
  responseSchema: JsonSchema;
  /** 출력 토큰 상한. provider 기본값보다 우선한다. */
  maxOutputTokens?: number;
}
