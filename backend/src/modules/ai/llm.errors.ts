/**
 * LLM 호출 실패를 재시도/fallback 정책이 구분할 수 있는 단위로 나눈다.
 * "500이면 무조건 재시도"처럼 뭉뚱그리면 복구 불가능한 실패에도 비용과 지연이 쌓인다.
 */

/** 같은 provider로 재시도해도 의미가 없고, 다음 provider로 넘겨야 하는 실패 (429) */
export class LlmRateLimitError extends Error {
  constructor(
    readonly providerName: string,
    message: string,
  ) {
    super(message);
    this.name = 'LlmRateLimitError';
  }
}

/** 일시적 실패라 같은 provider로 backoff 재시도할 가치가 있는 실패 (5xx, 네트워크, 타임아웃) */
export class LlmUnavailableError extends Error {
  constructor(
    readonly providerName: string,
    message: string,
  ) {
    super(message);
    this.name = 'LlmUnavailableError';
  }
}

/** 요청 자체가 잘못돼 재시도와 provider 교체 모두 무의미한 실패 (4xx, 인증 오류) */
export class LlmRequestError extends Error {
  constructor(
    readonly providerName: string,
    message: string,
  ) {
    super(message);
    this.name = 'LlmRequestError';
  }
}

/** 응답이 JSON으로 파싱되지 않는 실패. provider를 바꿔도 같은 프롬프트면 반복될 수 있다. */
export class LlmInvalidOutputError extends Error {
  constructor(
    readonly providerName: string,
    message: string,
  ) {
    super(message);
    this.name = 'LlmInvalidOutputError';
  }
}
