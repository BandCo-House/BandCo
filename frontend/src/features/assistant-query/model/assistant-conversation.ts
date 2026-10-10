import { createContext, useContext } from 'react';
import type {
  AskAssistantRequest,
  AssistantAnswer,
} from '@/entities/assistant/model/types';

/** 질문 하나와 그 답. 화면에는 이 단위가 대화처럼 아래로 쌓인다. */
export interface AssistantTurnState {
  id: number;
  body: AskAssistantRequest;
  label: string;
  /** 처음 누른 추천 질문에 짝지은 이어서 물어보기 중 아직 묻지 않은 것. 자유 질문이면 비어 있다. */
  followUps: string[];
  pending: boolean;
  answer?: AssistantAnswer;
  error?: unknown;
}

/** 한 밴드에 대한 대화. 앱 전체에서 하나만 들고 있는다. */
export interface AssistantConversation {
  bandId: string;
  turns: AssistantTurnState[];
}

export interface AssistantConversationValue {
  conversation: AssistantConversation | null;
  open: boolean;
  draft: string;
  pending: boolean;
  setDraft: (value: string) => void;
  /**
   * 같은 밴드 대화면 아래에 이어 붙이고, 다른 밴드면 새 대화로 시작한다.
   * fresh면 같은 밴드여도 새 대화로 시작한다(밴드 홈 카드에서 물을 때).
   */
  ask: (
    bandId: string,
    body: AskAssistantRequest,
    label: string,
    followUps: string[],
    fresh?: boolean,
  ) => void;
  /** 입력창의 질문을 보낸다. 너무 짧거나 답을 기다리는 중이면 무시한다. */
  submitDraft: (bandId: string, fresh?: boolean) => void;
  /** 대화 화면을 연다. 다른 밴드의 대화가 남아 있으면 비우고 연다. */
  openScreen: (bandId: string) => void;
  /** 화면만 닫는다. 대화는 남아 다시 열 수 있다. */
  closeScreen: () => void;
  /** 같은 밴드에서 대화를 비우고 처음부터 묻는다. */
  startNew: () => void;
  /** 대화를 끝내 이어서 보기도 사라지게 한다. */
  end: () => void;
  retry: (turn: AssistantTurnState) => void;
}

export const AssistantConversationContext =
  createContext<AssistantConversationValue | null>(null);

export const useAssistantConversation = (): AssistantConversationValue => {
  const value = useContext(AssistantConversationContext);
  if (value === null)
    throw new Error(
      'useAssistantConversation은 AssistantConversationProvider 안에서만 쓸 수 있습니다.',
    );
  return value;
};
