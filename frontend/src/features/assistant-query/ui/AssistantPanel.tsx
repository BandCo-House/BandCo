import { useState, type FormEvent } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  useAskAssistant,
  useAssistantPresets,
} from '@/entities/assistant/api/useAssistant';
import type { AssistantQueryResult } from '@/entities/assistant/model/types';

const MAX_QUESTION_LENGTH = 200;

const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const ATTENDANCE_LABEL: Record<string, string> = {
  PENDING: '미응답',
  ATTENDING: '참석',
  ABSENT: '불참',
};

const formatDateTime = (iso: string | null): string =>
  iso === null ? '시간 미정' : dateTimeFormatter.format(new Date(iso));

interface AssistantPanelProps {
  bandId: string;
}

/**
 * 자연어로 밴드 데이터를 조회하는 패널.
 *
 * 대화형 UI를 쓰지 않는다. 답변을 한 건만 보관하고 이력을 쌓지 않으며,
 * 자주 묻는 질문은 사용자가 바로 선택할 수 있도록 추천 질문으로 노출한다.
 */
export const AssistantPanel = ({ bandId }: AssistantPanelProps) => {
  const [question, setQuestion] = useState('');
  const [askedQuestion, setAskedQuestion] = useState<string | null>(null);
  const { data: presets } = useAssistantPresets();
  const {
    mutate,
    data: answer,
    isPending,
    isError,
    reset,
  } = useAskAssistant(bandId);

  const ask = (
    body: { question?: string; presetId?: string },
    label: string,
  ) => {
    setAskedQuestion(label);
    mutate(body);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (trimmed.length < 2 || isPending) return;
    ask({ question: trimmed }, trimmed);
    setQuestion('');
  };

  const handleReset = () => {
    setAskedQuestion(null);
    reset();
  };

  // 답변 전에는 추천 질문을, 답변 후에는 "다시 묻기"만 남겨 화면이 길어지지 않게 한다.
  const showPresets = askedQuestion === null;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-grey-500 p-4">
      <header className="flex items-center justify-between">
        <h2 className="typo-sm-b text-grey-100">밴드에 대해 물어보기</h2>
        {askedQuestion !== null && (
          <button
            type="button"
            onClick={handleReset}
            className="typo-xs-r text-grey-300"
          >
            처음으로
          </button>
        )}
      </header>

      {showPresets && presets !== undefined && (
        <ul className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <li key={preset.id}>
              <button
                type="button"
                onClick={() => ask({ presetId: preset.id }, preset.question)}
                className="rounded-full border border-key-muted px-3 py-1.5 typo-xs-r text-grey-200"
              >
                {preset.question}
              </button>
            </li>
          ))}
        </ul>
      )}

      {askedQuestion !== null && (
        <div className="flex flex-col gap-2">
          <p className="typo-xs-r text-grey-300">{askedQuestion}</p>
          {isPending && (
            <p className="typo-sm-r text-grey-300">찾아보는 중...</p>
          )}
          {isError && (
            <p className="typo-sm-r text-grey-300">
              지금은 답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.
            </p>
          )}
          {answer !== undefined && (
            <>
              <p className="typo-sm-m text-grey-100">{answer.summary}</p>
              {answer.result !== null && (
                <AssistantResultList result={answer.result} />
              )}
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="예: 지난달 합주 몇 번 했어?"
          aria-label="밴드 데이터에 대한 질문"
          disabled={isPending}
          className="h-11 flex-1 py-0 typo-sm-r"
        />
        <Button
          type="submit"
          size="sm"
          variant="accent"
          disabled={question.trim().length < 2 || isPending}
        >
          질문
        </Button>
      </form>
    </section>
  );
};

interface AssistantResultListProps {
  result: AssistantQueryResult;
}

/**
 * 요약 문장 아래에 조회된 행을 그대로 보여준다.
 * 요약과 목록이 같은 응답에서 나오므로 서로 어긋날 수 없다.
 */
const AssistantResultList = ({ result }: AssistantResultListProps) => {
  if (result.rows.length === 0) return null;

  if (result.entity === 'schedule') {
    return (
      <ul className="flex flex-col gap-1">
        {result.rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-3 typo-xs-r text-grey-200"
          >
            <span className="min-w-0 truncate">{row.title}</span>
            <span className="shrink-0 text-grey-300">
              {formatDateTime(row.startAt)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (result.entity === 'attendance') {
    return (
      <ul className="flex flex-col gap-1">
        {result.rows.map((row) => (
          <li
            key={`${row.scheduleId}-${row.bandMemberId}`}
            className="flex items-center justify-between gap-3 typo-xs-r text-grey-200"
          >
            <span className="min-w-0 truncate">{row.nickname}</span>
            <span className="shrink-0 text-grey-300">
              {ATTENDANCE_LABEL[row.attendanceStatus ?? 'PENDING']}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (result.entity === 'songPractice') {
    return (
      <ul className="flex flex-col gap-1">
        {result.rows.map((row) => (
          <li
            key={row.songId}
            className="flex items-center justify-between gap-3 typo-xs-r text-grey-200"
          >
            <span className="min-w-0 truncate">
              {row.title}{' '}
              <span className="text-grey-300">{row.artistName}</span>
            </span>
            <span className="shrink-0 text-grey-300">
              {row.practiceCount}회
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {result.rows.map((row) => (
        <li
          key={row.bandMemberId}
          className="flex items-center justify-between gap-3 typo-xs-r text-grey-200"
        >
          <span className="min-w-0 truncate">{row.nickname}</span>
          <span className="shrink-0 text-grey-300">
            {row.participationCount}회
          </span>
        </li>
      ))}
    </ul>
  );
};
