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
 * 대화 이력을 서버에 쌓지 않으므로 mutation으로 다룬다.
 * 대화가 앱 전체에서 하나라 밴드가 바뀔 수 있어, bandId는 훅이 아니라 호출마다 받는다.
 */
export const useAskAssistant = () =>
  useMutation({
    mutationFn: ({
      bandId,
      body,
    }: {
      bandId: string;
      body: AskAssistantRequest;
    }) => askAssistant(bandId, body),
  });
