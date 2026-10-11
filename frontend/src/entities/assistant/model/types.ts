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
  /** 같은 대화의 직전 턴(최대 3개). 첫 질문에는 보내지 않는다. */
  history?: AssistantHistoryTurn[];
  /** 대화에서 몇 번째 질문인지. 첫 질문에는 보내지 않는다. */
  turnIndex?: number;
}

export type AssistantTableResult = Extract<
  AssistantQueryResult,
  { entity: 'table' }
>;
