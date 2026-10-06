import { useRef, useState, type FormEvent } from 'react';
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
import { AssistantAnswerView } from './AssistantAnswerView';
import { AssistantSheet } from './AssistantSheet';
import { SuggestionList } from './SuggestionList';

const MAX_QUESTION_LENGTH = 200;
const MIN_QUESTION_LENGTH = 2;
const PLACEHOLDER = '예: 지난달 합주 몇 번 했어?';

interface AssistantPanelProps {
  bandId: string;
}

interface AskedQuestion {
  body: AskAssistantRequest;
  label: string;
}

/**
 * 밴드 홈의 물어보기 진입점.
 *
 * 홈에는 입력 한 줄과 추천 칩만 두고, 답은 전체 화면 시트에서 보여준다.
 * 답변을 한 건만 보관하고 대화 이력은 쌓지 않는다.
 */
export const AssistantPanel = ({ bandId }: AssistantPanelProps) => {
  const [open, setOpen] = useState(false);
  const [focusInput, setFocusInput] = useState(false);
  const [draft, setDraft] = useState('');
  const [asked, setAsked] = useState<AskedQuestion | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: presets = [] } = useAssistantPresets();
  const { mutate, data: answer, isPending, error } = useAskAssistant(bandId);

  const ask = (body: AskAssistantRequest, label: string) => {
    setAsked({ body, label });
    mutate(body, {
      // 실패하면 고쳐서 다시 물을 수 있게 직접 입력한 질문을 입력창에 되돌린다.
      onError: () => {
        if (body.question !== undefined) setDraft(body.question);
      },
    });
  };

  const askPreset = (preset: AssistantPreset) => {
    setFocusInput(false);
    setOpen(true);
    ask({ presetId: preset.id }, preset.question);
  };

  const openForTyping = () => {
    setFocusInput(true);
    setOpen(true);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (trimmed.length < MIN_QUESTION_LENGTH || isPending) return;
    setDraft('');
    ask({ question: trimmed }, trimmed);
  };

  const handleEdit = (question: string) => {
    setDraft(question);
    inputRef.current?.focus();
  };

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-grey-500 p-4">
      <h2 className="typo-sm-b text-grey-100">밴드에 대해 물어보기</h2>
      <button
        type="button"
        onClick={openForTyping}
        aria-label="밴드 데이터에 대해 질문하기"
        className="flex h-11 items-center rounded-full border border-grey-500 px-4 text-left typo-sm-r text-grey-300"
      >
        {PLACEHOLDER}
      </button>
      {presets.length > 0 && (
        <ul
          aria-label="추천 질문"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]"
        >
          {presets.map((preset) => (
            <li key={preset.id} className="shrink-0">
              <button
                type="button"
                onClick={() => askPreset(preset)}
                aria-label={preset.question}
                className="rounded-full border border-key-muted px-3 py-1.5 typo-xs-r text-grey-200"
              >
                {preset.label ?? preset.question}
              </button>
            </li>
          ))}
        </ul>
      )}

      <AssistantSheet
        open={open}
        onOpenChange={setOpen}
        onOpenFocus={focusInput ? () => inputRef.current?.focus() : undefined}
        footer={
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={MAX_QUESTION_LENGTH}
              placeholder={PLACEHOLDER}
              aria-label="밴드 데이터에 대한 질문"
              disabled={isPending}
              className="h-11 flex-1 py-0 typo-sm-r"
            />
            <Button
              type="submit"
              size="sm"
              variant="accent"
              disabled={draft.trim().length < MIN_QUESTION_LENGTH || isPending}
            >
              질문
            </Button>
          </form>
        }
      >
        {asked === null ? (
          <div className="flex flex-col gap-4">
            <p className="typo-base-r text-grey-100">
              밴드 일정, 참석, 곡, 팀에 대해 물어보세요. 밴드에 저장된 데이터로
              답해요.
            </p>
            <SuggestionList
              title="이렇게 물어볼 수 있어요"
              items={presets.map((preset) => ({
                key: preset.id,
                label: preset.question,
                onSelect: () => ask({ presetId: preset.id }, preset.question),
              }))}
            />
          </div>
        ) : (
          <AssistantAnswerView
            question={asked.label}
            isPending={isPending}
            error={error}
            answer={answer}
            presets={presets}
            onAsk={ask}
            onEdit={handleEdit}
            onRetry={() => ask(asked.body, asked.label)}
          />
        )}
      </AssistantSheet>
    </section>
  );
};
