import type { SqlResultMode } from '../sql/generated-sql.type';

export type AssistantResultValue = string | number | boolean | null;

export interface AssistantTableResult {
  entity: 'table';
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

export interface AssistantAnswer {
  /**
   * 지원 범위 밖의 질문도 정상 응답으로 돌려준다.
   * 오류로 처리하면 화면이 실패 상태가 되지만, 실제로는 사용자가 잘못한 것이 아니다.
   */
  answerable: boolean;
  /** 서버가 조회 결과로부터 결정적으로 만든 요약 문장 */
  summary: string;
  /** 실제 조회된 행과 추가 결과 여부다. 미지원 질문은 null이다. */
  result: AssistantTableResult | null;
  meta: AssistantQueryMeta;
}
