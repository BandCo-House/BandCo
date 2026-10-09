import type { AssistantQueryBucketName, AssistantQuerySignal } from './assistant-query-signal';

/**
 * 조회 한 건의 측정 기록이다. 사용자 응답에 들어가지 않고 품질 분석에만 쓴다.
 * exec_ok와 answered를 나눈 이유는, 실행 성공이 질문 충족을 뜻하지 않기 때문이다.
 */
export interface AssistantQueryLogEntry {
  bandId: string;
  userId: string;
  sessionId: string | null;
  turnIndex: number | null;
  presetId: string | null;
  question: string | null;
  intent: string | null;
  generatedSql: string | null;
  resultMode: string | null;
  /** 검증을 통과해 실행까지 끝났는지 */
  execOk: boolean;
  /** 질문에 답했는지. 결정론으로는 알 수 없어 판정이 붙기 전까지 null이다 */
  answered: boolean | null;
  bucket: AssistantQueryBucketName;
  signals: AssistantQuerySignal[];
  rowCount: number;
  hasMore: boolean;
  validationFailures: number;
  policyViolations: string[];
  latencyMs: number;
  usedLlm: boolean;
  modelName: string | null;
  inputTokens: number;
  outputTokens: number;
}
