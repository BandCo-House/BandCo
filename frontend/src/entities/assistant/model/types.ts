import type { z } from 'zod';
import type { assistantAnswerSchema, assistantPresetSchema } from './schema';

export type AssistantPreset = z.infer<typeof assistantPresetSchema>;
export type AssistantAnswer = z.infer<typeof assistantAnswerSchema>;
export type AssistantQueryResult = NonNullable<AssistantAnswer['result']>;

export interface AskAssistantRequest {
  question?: string;
  presetId?: string;
  /**
   * 한 대화를 묶는 키. 품질 측정에만 쓰이고 조회 범위에는 영향이 없다.
   * 밴드 범위는 서버가 멤버십을 확인한 bandId로 정한다.
   */
  sessionId?: string;
  /** 그 대화에서 몇 번째 질문인지. 0부터 시작한다. */
  turnIndex?: number;
}

export type AssistantTableResult = Extract<
  AssistantQueryResult,
  { entity: 'table' }
>;
