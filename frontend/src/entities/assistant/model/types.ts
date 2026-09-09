import type { z } from 'zod';
import type { assistantAnswerSchema, assistantPresetSchema } from './schema';

export type AssistantPreset = z.infer<typeof assistantPresetSchema>;
export type AssistantAnswer = z.infer<typeof assistantAnswerSchema>;
export type AssistantQueryResult = NonNullable<AssistantAnswer['result']>;

export interface AskAssistantRequest {
  question?: string;
  presetId?: string;
}
