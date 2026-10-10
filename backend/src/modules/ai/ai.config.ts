export type LlmProviderKind = 'gemini' | 'openai-compatible';

export const AI_CONFIG = Symbol('AI_CONFIG');

export interface LlmProviderConfig {
  /** 구현체를 고르는 식별자 */
  kind: LlmProviderKind;
  /** 로그와 응답에 노출되는 이름. 같은 kind를 여러 개 등록할 수 있어 별도로 둔다. */
  name: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface LlmProviderGroupConfig {
  name: string;
  credentials: LlmProviderConfig[];
}

export interface AiConfig {
  /** 선언 순서가 곧 provider fallback 우선순위다. */
  providerGroups: LlmProviderGroupConfig[];
  keyRotationEnabled: boolean;
  providerRotationEnabled: boolean;
  requestTimeoutMs: number;
  /** provider 하나당 일시 오류 재시도 횟수 (최초 호출 제외) */
  maxRetriesPerProvider: number;
  retryBaseDelayMs: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 300;
const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';

/**
 * 환경 변수 하나로 provider 조합과 우선순위를 바꿀 수 있게 한다.
 * 키가 없는 provider는 조용히 제외해서, 개발 환경에서 일부만 설정해도 동작하게 둔다.
 *
 * @param {NodeJS.ProcessEnv} environment - 현재 프로세스 환경 변수
 * @returns {AiConfig} 사용 가능한 provider 목록과 재시도 정책
 */
export function getAiConfig(environment: NodeJS.ProcessEnv = process.env): AiConfig {
  const declaredOrder = parseUniqueValues(environment.LLM_PROVIDERS ?? 'gemini');

  const providerGroups: LlmProviderGroupConfig[] = [];

  for (const name of declaredOrder) {
    const group = createProviderGroupConfig(name, environment);

    if (group !== null) {
      providerGroups.push(group);
    }
  }

  return {
    providerGroups,
    keyRotationEnabled: parseBoolean(environment.LLM_KEY_ROTATION_ENABLED),
    providerRotationEnabled: parseBoolean(environment.LLM_PROVIDER_ROTATION_ENABLED),
    requestTimeoutMs: parsePositiveInteger(environment.LLM_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    maxRetriesPerProvider: parsePositiveInteger(environment.LLM_MAX_RETRIES, DEFAULT_MAX_RETRIES),
    retryBaseDelayMs: parsePositiveInteger(environment.LLM_RETRY_BASE_DELAY_MS, DEFAULT_RETRY_BASE_DELAY_MS),
  };
}

/**
 * provider 이름에 맞는 환경 변수 묶음을 읽어 동일 모델의 credential group을 만든다.
 *
 * @param {string} name - LLM_PROVIDERS에 선언된 provider 이름
 * @param {NodeJS.ProcessEnv} environment - 현재 프로세스 환경 변수
 * @returns {LlmProviderGroupConfig | null} 설정이 완전하면 provider group, 아니면 null
 */
function createProviderGroupConfig(name: string, environment: NodeJS.ProcessEnv): LlmProviderGroupConfig | null {
  const prefix = name.toUpperCase().replace(/-/g, '_');
  const apiKeys = parseApiKeys(prefix, environment);

  if (apiKeys.length === 0) {
    return null;
  }

  if (name === 'gemini') {
    return {
      name,
      credentials: apiKeys.map(apiKey => ({
        kind: 'gemini',
        name,
        apiKey,
        model: environment.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL,
      })),
    };
  }

  const model = environment[`${prefix}_MODEL`];

  if (model === undefined || model.trim() === '') {
    return null;
  }

  return {
    name,
    credentials: apiKeys.map(apiKey => ({
      kind: 'openai-compatible',
      name,
      apiKey,
      model,
      baseUrl: environment[`${prefix}_BASE_URL`] ?? DEFAULT_OPENAI_BASE_URL,
    })),
  };
}

/** 기존 단일 key와 쉼표 구분 복수 key를 합치고 중복을 제거한다. */
function parseApiKeys(prefix: string, environment: NodeJS.ProcessEnv): string[] {
  return parseUniqueValues([environment[`${prefix}_API_KEY`] ?? '', environment[`${prefix}_API_KEYS`] ?? ''].join(','));
}

/** 쉼표 구분 값을 입력 순서대로 정리하고 중복을 제거한다. */
function parseUniqueValues(value: string): string[] {
  return [
    ...new Set(
      value
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== ''),
    ),
  ];
}

/** 토글은 명시적으로 true인 경우에만 활성화한다. */
function parseBoolean(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}

/**
 * 숫자 환경 변수를 읽되 잘못된 값은 기본값으로 되돌린다.
 *
 * @param {string | undefined} value - 환경 변수 원본 값
 * @param {number} fallback - 파싱 실패 시 사용할 기본값
 * @returns {number} 1 이상의 정수
 */
function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
