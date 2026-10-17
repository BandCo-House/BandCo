import type { z } from 'zod';
import type { assistantAnswerSchema, assistantPresetSchema } from './schema';

export type AssistantPreset = z.infer<typeof assistantPresetSchema>;
export type AssistantAnswer = z.infer<typeof assistantAnswerSchema>;
export type AssistantQueryResult = NonNullable<AssistantAnswer['result']>;

export type AssistantQueryContext = NonNullable<AssistantAnswer['context']>;

/** 같은 대화의 직전 턴. 결과 행과 답 문장은 보내지 않는다. */
export interface AssistantHistoryTurn extends AssistantQueryContext {
  question: string;
}

export interface AskAssistantRequest {
  question?: string;
  presetId?: string;
  /**
   * 한 대화를 묶는 키. 품질 측정에만 쓰이고 조회 범위에는 영향이 없다.
   * 밴드 범위는 서버가 멤버십을 확인한 bandId로 정한다.
   */
  sessionId?: string;
  /** 같은 대화의 직전 턴(최대 3개). 첫 질문에는 보내지 않는다. */
  history?: AssistantHistoryTurn[];
  /** 대화에서 몇 번째 질문인지. 첫 질문에는 보내지 않는다. */
  turnIndex?: number;
}

export type AssistantTableResult = Extract<
  AssistantQueryResult,
  { entity: 'table' }
>;
