import type { SqlParameterType, SqlQueryPage, SqlResultMode } from '../sql/generated-sql.type';

/**
 * 결정론으로 붙이는 의심 신호다. 모델을 쓰지 않으므로 같은 입력에 항상 같은 결과가 나온다.
 *
 * ★왜 필요한가: 검증과 실행이 모두 성공해도 질문과 어긋난 답일 수 있고, 그 경우가 지금은
 *   outcome 'success' 로만 남아 실사용 품질을 알 수 없다. 틀렸다는 것을 코드가 직접 알 수는
 *   없지만, '의심할 만한 자리'는 알 수 있다. 그 자리만 모아서 사람·모델 판정의 입력으로 쓴다.
 *
 * ★재질문(앞 답이 틀렸다는 가장 싼 신호)은 여기서 붙이지 않는다. 쓰기 시점에 앞 턴을 다시
 *   읽어야 하고 유사도 기준이 바뀌면 과거 행이 낡는다. session_id·turn_index·question 을
 *   남겨 두고 분석 질의에서 계산한다(docs/backend/operations/assistant-analytics.md).
 */
export const ASSISTANT_QUERY_SIGNALS = {
  /** 검증·실행은 됐는데 결과가 0행이다. 조건을 너무 좁게 걸었을 수 있다. */
  EMPTY_RESULT: 'EMPTY_RESULT',
  /** 단일 집계인데 값이 null이거나 0이다. JOIN이 끊겼을 때 흔히 이렇게 보인다. */
  ZERO_VALUE: 'ZERO_VALUE',
  /** 서버 상한인 50행에 걸려 뒤가 잘렸다. 질문이 목록을 좁히지 못했다. */
  ROW_LIMIT_REACHED: 'ROW_LIMIT_REACHED',
  /** 처음 만든 SQL이 규칙을 어겨 다시 만들었다. 프롬프트가 못 잡은 자리다. */
  REGENERATED: 'REGENERATED',
  /** 허용 목록 밖 테이블·함수·쓰기를 시도했다. 질문이 경계를 시험했는지 보는 자리다. */
  POLICY_VIOLATION: 'POLICY_VIOLATION',
  /** 질문에 기간 표현이 있는데 SQL에 시간 조건이 없다. 전체 기간을 집계했을 수 있다. */
  MISSING_DATE_FILTER: 'MISSING_DATE_FILTER',
} as const;

export type AssistantQuerySignal = (typeof ASSISTANT_QUERY_SIGNALS)[keyof typeof ASSISTANT_QUERY_SIGNALS];

/** 결정론으로 정할 수 있는 분류만 둔다. '질문과 다른 것에 답함'은 판정이 붙을 때 추가한다. */
export type AssistantQueryBucketName =
  | 'OK'
  | 'EMPTY_RESULT'
  | 'TRUNCATED'
  | 'POLICY_VIOLATION'
  | 'UNSUPPORTED'
  | 'CLARIFICATION'
  | 'REPHRASE'
  | 'INFRA';

/**
 * 질문에 들어오는 기간·시점 표현. 여기 걸리면 SQL에도 시간 조건이 있어야 한다.
 * 좁게 잡아 오탐을 줄인다. '이번'처럼 단독으로는 기간이 아닌 말은 넣지 않는다.
 */
const DATE_EXPRESSION =
  /지난\s?(주|달|월|해|년)|이번\s?(주|달|월|해|년)|다음\s?(주|달|월|해|년)|작년|올해|내년|어제|오늘|내일|최근|요즘|\d+\s?(일|주|달|개월|년)\s?(전|간|동안)|\d{4}\s?년|\d{1,2}\s?월|상반기|하반기|분기/;

/** 시간 조건으로 인정하는 파라미터 타입. 서버가 바인딩하는 $1(uuid)은 포함되지 않는다. */
const DATE_PARAMETER_TYPES: SqlParameterType[] = ['DATE', 'TIMESTAMPTZ'];

/** 파라미터 없이 시간을 좁히는 표현. 검증기가 허용한 것만 본다. */
const SQL_DATE_FUNCTIONS = /CURRENT_DATE|CURRENT_TIMESTAMP|date_trunc|now\(/i;

export interface SignalInput {
  resultMode?: SqlResultMode;
  page: SqlQueryPage;
  question: string | null;
  generatedSql: string;
  parameterTypes: SqlParameterType[];
  validationFailures: number;
  policyViolations: string[];
}

/**
 * 실행까지 끝난 조회에 의심 신호를 붙인다.
 *
 * @param {SignalInput} input - 실행 결과와 생성 과정의 사실
 * @returns {AssistantQuerySignal[]} 붙은 신호. 의심할 자리가 없으면 빈 배열
 */
export function detectSignals(input: SignalInput): AssistantQuerySignal[] {
  const signals: AssistantQuerySignal[] = [];

  if (input.page.rows.length === 0) signals.push(ASSISTANT_QUERY_SIGNALS.EMPTY_RESULT);
  if (isZeroAggregate(input)) signals.push(ASSISTANT_QUERY_SIGNALS.ZERO_VALUE);
  if (input.page.hasMore) signals.push(ASSISTANT_QUERY_SIGNALS.ROW_LIMIT_REACHED);
  if (input.validationFailures > 0) signals.push(ASSISTANT_QUERY_SIGNALS.REGENERATED);
  if (input.policyViolations.length > 0) signals.push(ASSISTANT_QUERY_SIGNALS.POLICY_VIOLATION);
  if (missesDateFilter(input)) signals.push(ASSISTANT_QUERY_SIGNALS.MISSING_DATE_FILTER);

  return signals;
}

/**
 * 단일 집계가 0이나 null로 나왔는지 본다.
 * 0이 정답인 질문도 있으므로 실패로 단정하지 않고 의심 신호로만 둔다.
 */
function isZeroAggregate(input: SignalInput): boolean {
  if (input.resultMode !== 'AGGREGATE' || input.page.rows.length !== 1) return false;

  const values = Object.values(input.page.rows[0]);

  return values.length === 1 && isZeroOrNull(values[0]);
}

function isZeroOrNull(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'number') return value === 0;
  if (typeof value === 'bigint') return value === 0n;
  // Decimal·숫자 문자열은 toString이 '0' 또는 '0.00' 형태로 온다.
  if (typeof value === 'string' || typeof value === 'object') return /^-?0(\.0+)?$/.test(String(value));

  return false;
}

/**
 * 질문은 기간을 말했는데 SQL이 시간을 좁히지 않았는지 본다.
 * 파라미터 타입과 허용 함수만 보고 AST를 다시 파싱하지 않는다.
 */
function missesDateFilter(input: SignalInput): boolean {
  if (input.question === null || !DATE_EXPRESSION.test(input.question)) return false;

  const hasDateParameter = input.parameterTypes.some(type => DATE_PARAMETER_TYPES.includes(type));

  return !hasDateParameter && !SQL_DATE_FUNCTIONS.test(input.generatedSql);
}

/**
 * 신호와 결과를 결정론 분류 하나로 좁힌다. 가장 먼저 설명이 되는 것을 고른다.
 * 질문에 실제로 답했는지(answered)는 여기서 정하지 않는다 — 결정론으로는 알 수 없다.
 *
 * @param {AssistantQuerySignal[]} signals - detectSignals 결과
 * @returns {AssistantQueryBucketName} 실행이 끝난 조회의 분류
 */
export function resolveExecutedBucket(signals: AssistantQuerySignal[]): AssistantQueryBucketName {
  if (signals.includes(ASSISTANT_QUERY_SIGNALS.POLICY_VIOLATION)) return 'POLICY_VIOLATION';
  if (signals.includes(ASSISTANT_QUERY_SIGNALS.EMPTY_RESULT)) return 'EMPTY_RESULT';
  if (signals.includes(ASSISTANT_QUERY_SIGNALS.ROW_LIMIT_REACHED)) return 'TRUNCATED';

  return 'OK';
}
