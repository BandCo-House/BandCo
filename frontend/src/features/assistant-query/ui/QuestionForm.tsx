import { useState, type FormEvent } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

const MAX_QUESTION_LENGTH = 200;
const MIN_QUESTION_LENGTH = 2;

interface QuestionFormProps {
  inputId: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  /** 홈에서는 입력을 시작할 때만 버튼을 보여주고, 대화 화면에서는 항상 보여준다. */
  alwaysShowSubmit: boolean;
}

export const QuestionForm = ({
  inputId,
  draft,
  onDraftChange,
  onSubmit,
  disabled,
  alwaysShowSubmit,
}: QuestionFormProps) => {
  const [focused, setFocused] = useState(false);
  const showSubmit = alwaysShowSubmit || focused || draft.length > 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
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
