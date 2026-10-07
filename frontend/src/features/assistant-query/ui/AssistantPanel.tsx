import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  useAskAssistant,
  useAssistantPresets,
} from '@/entities/assistant/api/useAssistant';
import type {
  AskAssistantRequest,
  AssistantPreset,
} from '@/entities/assistant/model/types';
import { AssistantScreen } from './AssistantScreen';
import { SuggestionChip } from './SuggestionChip';
import { AssistantTurn, type AssistantTurnState } from './AssistantTurn';

const MAX_QUESTION_LENGTH = 200;
const MIN_QUESTION_LENGTH = 2;
/** 답하는 중 표시를 최소로 보여주는 시간(ms) */
const MIN_REPLY_MS = 700;

interface AssistantPanelProps {
  bandId: string;
}

interface QuestionFormProps {
  inputId: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  disabled: boolean;
  /** 홈에서는 입력을 시작할 때만 버튼을 보여주고, 대화 화면에서는 항상 보여준다. */
  alwaysShowSubmit: boolean;
}

const QuestionForm = ({
  inputId,
  draft,
  onDraftChange,
  onSubmit,
  disabled,
  alwaysShowSubmit,
}: QuestionFormProps) => {
  const [focused, setFocused] = useState(false);
  const showSubmit = alwaysShowSubmit || focused || draft.length > 0;

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      {/* 버튼이 나타나도 입력창이 줄어들 수 있게 감싼다. 입력창 모양은 공용 기본값을 그대로 쓴다. */}
      <div className="min-w-0 flex-1">
        <Input
          id={inputId}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="예: 지난달 합주 몇 번 했어?"
          aria-label="밴드 데이터에 대한 질문"
          enterKeyHint="send"
          disabled={disabled}
        />
      </div>
      {showSubmit && (
        <Button
          type="submit"
          size="pill"
          variant="accent"
          disabled={draft.trim().length < MIN_QUESTION_LENGTH || disabled}
          className="animate-in typo-base-b duration-200 zoom-in-95 fade-in motion-reduce:animate-none"
        >
          질문
        </Button>
      )}
    </form>
  );
};

/**
 * 밴드 홈의 물어보기 카드.
 *
 * 홈에서 바로 입력하거나 추천 칩을 누르면 대화 화면이 아래에서 올라온다.
 * 이어서 묻는 질문은 그 화면에 차례로 쌓이고, 닫은 뒤 다시 물으면 새 대화로 시작한다.
 */
export const AssistantPanel = ({ bandId }: AssistantPanelProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<AssistantTurnState[]>([]);
  const nextTurnId = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestTurnRef = useRef<HTMLDivElement>(null);
  const { data: presets = [] } = useAssistantPresets();
  const { mutateAsync } = useAskAssistant(bandId);
  const pending = turns.some((turn) => turn.pending);

  // 새 질문이 생기면 그 질문이 화면 위쪽에 오게 부드럽게 옮긴다. 긴 답의 끝으로 튀지 않는다.
  useEffect(() => {
    latestTurnRef.current?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'start',
    });
  }, [turns.length]);

  const updateTurn = (id: number, patch: Partial<AssistantTurnState>) =>
    setTurns((previous) =>
      previous.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn)),
    );

  const run = (id: number, body: AskAssistantRequest) => {
    // 추천 질문은 수십 ms 만에 와서 질문과 답이 한꺼번에 뜬다. 답하는 중임을 잠깐 보여준 뒤 답을 연다.
    const minimumReply = new Promise((resolve) =>
      setTimeout(resolve, MIN_REPLY_MS),
    );
    void Promise.all([mutateAsync(body), minimumReply])
      .then(([answer]) => updateTurn(id, { pending: false, answer }))
      .catch((error: unknown) => {
        updateTurn(id, { pending: false, error });
        // 고쳐서 다시 물을 수 있게 직접 입력한 질문을 입력창에 되돌린다.
        if (body.question !== undefined) setDraft(body.question);
      });
  };

  /** 대화 화면이 닫혀 있으면 새 대화로 시작하고, 열려 있으면 아래에 이어 붙인다. */
  const ask = (
    body: AskAssistantRequest,
    label: string,
    followUps: string[],
  ) => {
    const turn: AssistantTurnState = {
      id: nextTurnId.current++,
      body,
      label,
      followUps,
      pending: true,
    };
    setTurns((previous) => (open ? [...previous, turn] : [turn]));
    setOpen(true);
    run(turn.id, body);
  };

  const askPreset = (preset: AssistantPreset) =>
    ask({ presetId: preset.id }, preset.question, preset.followUps ?? []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (trimmed.length < MIN_QUESTION_LENGTH || pending) return;
    setDraft('');
    // 키보드를 내려 올라오는 답이 가려지지 않게 한다.
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    ask({ question: trimmed }, trimmed, []);
  };

  const retry = (turn: AssistantTurnState) => {
    updateTurn(turn.id, { pending: true, error: undefined });
    run(turn.id, turn.body);
  };

  return (
    <section aria-label="밴드에 대해 물어보기" className="flex flex-col gap-3">
      <h2 className="typo-base-sb text-grey-100">밴드에 대해 물어보기</h2>
      <QuestionForm
        inputId="assistant-home-question"
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={handleSubmit}
        disabled={pending}
        alwaysShowSubmit={false}
      />
      {presets.length > 0 && (
        // 칩이 많지 않아 가로 스크롤 대신 줄바꿈으로 모두 보여준다.
        <ul aria-label="추천 질문" className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <li key={preset.id}>
              <SuggestionChip
                label={preset.label ?? preset.question}
                ariaLabel={preset.question}
                onSelect={() => askPreset(preset)}
              />
            </li>
          ))}
        </ul>
      )}

      <AssistantScreen
        open={open}
        onOpenChange={setOpen}
        scrollRef={scrollRef}
        footer={
          <QuestionForm
            inputId="assistant-screen-question"
            draft={draft}
            onDraftChange={setDraft}
            onSubmit={handleSubmit}
            disabled={pending}
            alwaysShowSubmit
          />
        }
      >
        {turns.map((turn, index) => {
          const isLatest = index === turns.length - 1;
          return (
            <div
              key={turn.id}
              ref={isLatest ? latestTurnRef : undefined}
              className="scroll-mt-4"
            >
              <AssistantTurn
                turn={turn}
                isLatest={isLatest}
                presets={presets}
                onFollowUp={(question) =>
                  ask(
                    { question },
                    question,
                    turn.followUps.filter((followUp) => followUp !== question),
                  )
                }
                onAskPreset={askPreset}
                onAskCandidate={(question) => ask({ question }, question, [])}
                onRetry={() => retry(turn)}
              />
            </div>
          );
        })}
      </AssistantScreen>
    </section>
  );
};
