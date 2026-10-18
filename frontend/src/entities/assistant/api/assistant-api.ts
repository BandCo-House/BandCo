import { apiGet, apiPost } from '@/shared/api';
import { assistantAnswerSchema, assistantPresetSchema } from '../model/schema';
import type {
  AskAssistantRequest,
  AssistantAnswer,
  AssistantPreset,
} from '../model/types';
import { z } from 'zod';

const presetListSchema = z.array(assistantPresetSchema);

interface GetAssistantPresetsResult {
  presets: unknown[];
}

/**
 * 추천 질문 목록을 조회한다.
 * 목록은 고정이지만 선택한 질문도 자유 질문과 같은 Text-to-SQL 경로로 처리한다.
 */
export const getAssistantPresets = async (): Promise<AssistantPreset[]> => {
  const data = await apiGet<GetAssistantPresetsResult>('/assistant/presets');
  return presetListSchema.parse(data.presets);
};

/**
 * 자연어 질문 또는 추천 질문으로 밴드 데이터를 조회한다.
 */
export const askAssistant = async (
  bandId: string,
  body: AskAssistantRequest,
): Promise<AssistantAnswer> => {
  const data = await apiPost<unknown>(`/bands/${bandId}/assistant/query`, body);
  return assistantAnswerSchema.parse(data);
};
