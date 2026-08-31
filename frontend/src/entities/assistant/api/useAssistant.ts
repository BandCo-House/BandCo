import { useMutation, useQuery } from '@tanstack/react-query';
import { askAssistant, getAssistantPresets } from './assistant-api';
import type { AskAssistantRequest } from '../model/types';

export const assistantKeys = {
  all: ['assistant'] as const,
  presets: () => [...assistantKeys.all, 'presets'] as const,
};

/**
 * 추천 질문은 서버에서 고정 목록으로 내려오므로 오래 캐시해 둔다.
 */
export const useAssistantPresets = () =>
  useQuery({
    queryKey: assistantKeys.presets(),
    queryFn: getAssistantPresets,
    staleTime: Infinity,
  });

/**
 * 질문 1건을 조회한다.
 * 대화 이력을 서버에 쌓지 않으므로 mutation으로 다루고, 화면에서 마지막 답변만 보관한다.
 */
export const useAskAssistant = (bandId: string) =>
  useMutation({
    mutationFn: (body: AskAssistantRequest) => askAssistant(bandId, body),
  });
