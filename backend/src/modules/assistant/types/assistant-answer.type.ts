import type { SqlResultMode } from '../sql/generated-sql.type';

export type AssistantResultValue = string | number | boolean | null;

export interface AssistantTableResult {
  entity: 'table';
  /** 결과 제목. 집계 숫자나 단건 카드의 설명으로 쓴다. */
  title: string;
  columns: Array<{ key: string; label: string; format: 'plain' | 'datetime' }>;
  rows: Array<Record<string, AssistantResultValue>>;
  hasMore: boolean;
  maxRows: number;
  resultMode: SqlResultMode | 'LEGACY';
  conditions: string[];
}

export interface AssistantQueryMeta {
  /** SQL을 생성한 provider와 모델이다. */
  providerName: string | null;
  modelName: string | null;
  /** LLM 사용 여부. 실험별 비용 측정의 기준이 된다. */
  usedLlm: boolean;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

/**
 * 화면이 다음 행동을 고를 수 있게 응답 종류를 구분한다.
 * REPHRASE는 재생성까지 안전한 SQL을 만들지 못한 경우로, 장애가 아니라 질문을 바꾸면 해결될 수 있다.
 */
export type AssistantAnswerKind = 'ANSWER' | 'UNSUPPORTED' | 'CLARIFICATION' | 'REPHRASE';

/** 확인이 필요한 이름 후보. question을 그대로 보내면 그 후보로 다시 조회한다. */
export interface AssistantClarification {
  candidates: Array<{ name: string; question: string }>;
  hasMore: boolean;
}

export interface AssistantAnswer {
  /**
   * 지원 범위 밖의 질문도 정상 응답으로 돌려준다.
   * 오류로 처리하면 화면이 실패 상태가 되지만, 실제로는 사용자가 잘못한 것이 아니다.
   */
  answerable: boolean;
  kind: AssistantAnswerKind;
  /** 서버가 조회 결과로부터 결정적으로 만든 요약 문장 */
  summary: string;
  /** 실제 조회된 행과 추가 결과 여부다. 미지원 질문은 null이다. */
  result: AssistantTableResult | null;
  /** CLARIFICATION일 때만 있다. */
  clarification: AssistantClarification | null;
  meta: AssistantQueryMeta;
}
