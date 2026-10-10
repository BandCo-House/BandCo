export interface LlmTokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface LlmStructuredResponse {
  /** 스키마 검증 전의 파싱 결과. 의미 검증은 호출자가 수행한다. */
  parsed: unknown;
  /** 실제 응답을 만든 provider 이름. fallback이 일어났는지 판별하는 근거가 된다. */
  providerName: string;
  modelName: string;
  usage: LlmTokenUsage | null;
  latencyMs: number;
}
