import { useCallback, useRef, useState, type ReactNode } from 'react';
import { useAskAssistant } from '@/entities/assistant/api/useAssistant';
import type { AskAssistantRequest } from '@/entities/assistant/model/types';
import {
  AssistantConversationContext,
  type AssistantConversation,
  type AssistantTurnState,
} from '../model/assistant-conversation';

const MIN_QUESTION_LENGTH = 2;
/** 답하는 중 표시를 최소로 보여주는 시간(ms) */
const MIN_REPLY_MS = 700;

/**
 * 측정에 쓰는 대화 키다. 화면 상태(conversation)와 달리 렌더를 기다리지 않아야 해서 ref로 둔다.
 * 질문을 연달아 누르면 setState가 아직 반영되지 않은 사이에도 턴 순서가 밀리지 않아야 한다.
 */
interface SessionKey {
  bandId: string;
  sessionId: string;
  nextTurnIndex: number;
}

/**
 * 물어보기 대화를 앱 전체에서 하나만 들고 있는다.
 *
 * 화면을 닫고 다른 페이지로 옮겨도 대화가 남아 이어서 볼 수 있다.
 * 새 대화를 누르거나, 끝내거나, 다른 밴드에서 물을 때만 비운다.
 */
export const AssistantConversationProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [conversation, setConversation] =
    useState<AssistantConversation | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const nextTurnId = useRef(0);
  const sessionKey = useRef<SessionKey | null>(null);
  const { mutateAsync } = useAskAssistant();
  const pending = conversation?.turns.some((turn) => turn.pending) ?? false;

  // 새 대화로 바뀐 뒤 늦게 온 이전 답은 id가 없어 그대로 버려진다.
  const updateTurn = (id: number, patch: Partial<AssistantTurnState>) =>
    setConversation(
      (previous) =>
        previous && {
          ...previous,
          turns: previous.turns.map((turn) =>
            turn.id === id ? { ...turn, ...patch } : turn,
          ),
        },
    );

  /**
   * 이 질문이 속한 대화 키와 턴 순서를 정한다.
   * 새 대화이거나 다른 밴드면 새 키를 만든다. 조건은 대화 상태를 비우는 조건과 같다.
   */
  const beginTurn = (bandId: string, fresh: boolean) => {
    const previous = sessionKey.current;
    if (fresh || previous === null || previous.bandId !== bandId) {
      sessionKey.current = {
        bandId,
        sessionId: crypto.randomUUID(),
        nextTurnIndex: 0,
      };
    }
    const current = sessionKey.current as SessionKey;
    const turnIndex = current.nextTurnIndex;
    current.nextTurnIndex += 1;

    return { sessionId: current.sessionId, turnIndex };
  };

  const run = (
    id: number,
    bandId: string,
    body: AskAssistantRequest,
    session: { sessionId: string; turnIndex: number },
  ) => {
    // 추천 질문은 수십 ms 만에 와서 질문과 답이 한꺼번에 뜬다. 답하는 중임을 잠깐 보여준 뒤 답을 연다.
    const minimumReply = new Promise((resolve) =>
      setTimeout(resolve, MIN_REPLY_MS),
    );
    void Promise.all([
      mutateAsync({ bandId, body: { ...body, ...session } }),
      minimumReply,
    ])
      .then(([answer]) => updateTurn(id, { pending: false, answer }))
      .catch((error: unknown) => {
        updateTurn(id, { pending: false, error });
        // 고쳐서 다시 물을 수 있게 직접 입력한 질문을 입력창에 되돌린다.
        if (body.question !== undefined) setDraft(body.question);
      });
  };

  const ask = (
    bandId: string,
    body: AskAssistantRequest,
    label: string,
    followUps: string[],
    fresh = false,
  ) => {
    const session = beginTurn(bandId, fresh);
    const turn: AssistantTurnState = {
      id: nextTurnId.current++,
      turnIndex: session.turnIndex,
      body,
      label,
      followUps,
      pending: true,
    };
    setConversation((previous) =>
      !fresh && previous?.bandId === bandId
        ? { ...previous, turns: [...previous.turns, turn] }
        : { bandId, turns: [turn] },
    );
    setOpen(true);
    run(turn.id, bandId, body, session);
  };

  const submitDraft = (bandId: string, fresh = false) => {
    const trimmed = draft.trim();
    if (trimmed.length < MIN_QUESTION_LENGTH || pending) return;
    setDraft('');
    // 키보드를 내려 올라오는 답이 가려지지 않게 한다.
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    ask(bandId, { question: trimmed }, trimmed, [], fresh);
  };

  const openScreen = (bandId: string) => {
    setConversation((previous) =>
      previous?.bandId === bandId ? previous : { bandId, turns: [] },
    );
    setOpen(true);
  };

  // 경로가 바뀔 때 화면을 내리는 effect의 의존성이라 렌더마다 바뀌지 않게 고정한다.
  const closeScreen = useCallback(() => setOpen(false), []);

  const startNew = () => {
    setConversation((previous) => previous && { ...previous, turns: [] });
    setDraft('');
    // 새 대화는 새 키를 받는다. 다음 질문에서 beginTurn이 만든다.
    sessionKey.current = null;
  };

  const end = () => {
    setConversation(null);
    setDraft('');
    sessionKey.current = null;
  };

  // 같은 질문을 다시 보내는 것이라 턴을 새로 세지 않는다. 재시도가 턴 수를 부풀리면 턴별 실패율이 왜곡된다.
  const retry = (turn: AssistantTurnState) => {
    if (conversation === null || sessionKey.current === null) return;
    updateTurn(turn.id, { pending: true, error: undefined });
    run(turn.id, conversation.bandId, turn.body, {
      sessionId: sessionKey.current.sessionId,
      turnIndex: turn.turnIndex,
    });
  };

  return (
    <AssistantConversationContext.Provider
      value={{
        conversation,
        open,
        draft,
        pending,
        setDraft,
        ask,
        submitDraft,
        openScreen,
        closeScreen,
        startNew,
        end,
        retry,
      }}
    >
      {children}
    </AssistantConversationContext.Provider>
  );
};
