import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAskAssistant } from '@/entities/assistant/api/useAssistant';
import type {
  AskAssistantRequest,
  AssistantHistoryTurn,
} from '@/entities/assistant/model/types';
import {
  AssistantConversationContext,
  MAX_CONVERSATION_TURNS,
  MAX_HISTORY_TURNS,
  type AssistantConversation,
  type AssistantTurnState,
} from '../model/assistant-conversation';

const MIN_QUESTION_LENGTH = 2;
/** 답하는 중 표시를 최소로 보여주는 시간(ms) */
const MIN_REPLY_MS = 700;

/**
 * 답한 턴 중 마지막 몇 개를 다음 질문의 직전 턴으로 만든다.
 * "그중에"가 가리키는 조건을 모델이 알 수 있게 서버가 준 조회 구조를 그대로 돌려보낸다. 결과 행과 답 문장은 보내지 않는다.
 */
const toHistory = (turns: AssistantTurnState[]): AssistantHistoryTurn[] =>
  turns
    .flatMap((turn) =>
      turn.answer?.context
        ? [{ question: turn.label, ...turn.answer.context }]
        : [],
    )
    .slice(-MAX_HISTORY_TURNS);

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
  // 늦게 온 실패 응답이 지금 대화에 속하는지 확인하려고 최신 대화를 들고 있는다.
  const conversationRef = useRef(conversation);
  useLayoutEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);
  const { mutateAsync } = useAskAssistant();
  const pending = conversation?.turns.some((turn) => turn.pending) ?? false;
  const limitReached =
    (conversation?.turns.length ?? 0) >= MAX_CONVERSATION_TURNS;

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

  const run = (id: number, bandId: string, body: AskAssistantRequest) => {
    // 추천 질문은 수십 ms 만에 와서 질문과 답이 한꺼번에 뜬다. 답하는 중임을 잠깐 보여준 뒤 답을 연다.
    const minimumReply = new Promise((resolve) =>
      setTimeout(resolve, MIN_REPLY_MS),
    );
    void Promise.all([mutateAsync({ bandId, body }), minimumReply])
      .then(([answer]) => updateTurn(id, { pending: false, answer }))
      .catch((error: unknown) => {
        updateTurn(id, { pending: false, error });
        // 고쳐서 다시 물을 수 있게 직접 입력한 질문을 입력창에 되돌린다.
        // 닫았거나 새 대화로 바뀐 뒤의 실패는 되돌리지 않고, 그사이 입력 중인 내용도 덮지 않는다.
        const alive = conversationRef.current?.turns.some(
          (turn) => turn.id === id,
        );
        const question = body.question;
        if (alive && question !== undefined)
          setDraft((current) => (current === '' ? question : current));
      });
  };

  const ask = (
    bandId: string,
    body: AskAssistantRequest,
    label: string,
    followUps: string[],
    fresh = false,
  ) => {
    const previousTurns =
      !fresh && conversation?.bandId === bandId ? conversation.turns : [];
    if (previousTurns.length >= MAX_CONVERSATION_TURNS) return;
    const history = toHistory(previousTurns);
    // 첫 질문의 본문은 그대로 두고, 이어서 묻는 질문에만 직전 턴과 순서를 붙인다.
    const requestBody: AskAssistantRequest = {
      ...body,
      ...(history.length > 0 ? { history } : {}),
      ...(previousTurns.length > 0
        ? { turnIndex: previousTurns.length + 1 }
        : {}),
    };
    const turn: AssistantTurnState = {
      id: nextTurnId.current++,
      body: requestBody,
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
    run(turn.id, bandId, requestBody);
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
  };

  const end = () => {
    setConversation(null);
    setDraft('');
  };

  const retry = (turn: AssistantTurnState) => {
    if (conversation === null) return;
    updateTurn(turn.id, { pending: true, error: undefined });
    run(turn.id, conversation.bandId, turn.body);
  };

  return (
    <AssistantConversationContext.Provider
      value={{
        conversation,
        open,
        draft,
        pending,
        limitReached,
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
