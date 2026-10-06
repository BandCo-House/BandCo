import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/shared/ui/button';
import type {
  AskAssistantRequest,
  AssistantAnswer,
  AssistantPreset,
} from '@/entities/assistant/model/types';
import { AssistantResult } from './AssistantResult';
import { SuggestionList } from './SuggestionList';

/** 응답을 기다리는 동안 바꿔 보여줄 단계 문구와 전환 시각(ms) */
const LOADING_STAGES = [
  { after: 0, text: '질문을 이해하고 있어요' },
  { after: 1500, text: '밴드 데이터를 찾고 있어요' },
  { after: 5000, text: '조금만 더 기다려 주세요' },
];
const MAX_FOLLOW_UPS = 3;
const TOO_MANY_REQUESTS = 429;

const FALLBACK_TITLE: Partial<Record<AssistantAnswer['kind'], string>> = {
  UNSUPPORTED: '이런 질문은 답할 수 있어요',
  REPHRASE: '이런 질문은 바로 답할 수 있어요',
};

interface AssistantAnswerViewProps {
  question: string;
  isPending: boolean;
  error: unknown;
  answer: AssistantAnswer | undefined;
  presets: AssistantPreset[];
  onAsk: (body: AskAssistantRequest, label: string) => void;
  onEdit: (question: string) => void;
  onRetry: () => void;
}

/**
 * 질문 하나에 대한 화면. 응답 종류마다 사용자가 다음에 할 수 있는 행동을 함께 보여준다.
 */
export const AssistantAnswerView = ({
  question,
  isPending,
  error,
  answer,
  presets,
  onAsk,
  onEdit,
  onRetry,
}: AssistantAnswerViewProps) => {
  const askPreset = (preset: AssistantPreset) =>
    onAsk({ presetId: preset.id }, preset.question);
  const otherPresets = presets.filter((preset) => preset.question !== question);

  return (
    <article className="flex flex-col gap-4" aria-busy={isPending}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 typo-sm-r text-grey-300">{question}</p>
        {!isPending && (
          <button
            type="button"
            onClick={() => onEdit(question)}
            className="shrink-0 typo-sm-r text-grey-300 underline underline-offset-4"
          >
            수정
          </button>
        )}
      </div>

      {isPending && <LoadingState />}

      {!isPending && error !== null && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="typo-base-r text-grey-100">{errorMessage(error)}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="border-grey-300 text-grey-50"
          >
            다시 시도
          </Button>
        </div>
      )}

      {!isPending && answer !== undefined && (
        <>
          {answer.kind === 'ANSWER' &&
            answer.result?.entity === 'table' &&
            answer.result.conditions.length > 0 && (
              <ul aria-label="조회 조건" className="flex flex-wrap gap-1.5">
                {answer.result.conditions.map((condition) => (
                  <li
                    key={condition}
                    className="rounded-full bg-grey-500/24 px-2.5 py-1 typo-xs-r text-grey-200"
                  >
                    {condition}
                  </li>
                ))}
              </ul>
            )}

          <p
            className={
              answer.kind === 'ANSWER'
                ? 'typo-base-sb text-grey-50'
                : 'typo-base-r text-grey-100'
            }
          >
            {headline(answer)}
          </p>

          {answer.result !== null && <AssistantResult result={answer.result} />}

          {answer.result?.entity === 'table' && answer.result.hasMore && (
            <p className="typo-sm-r text-grey-300">
              {answer.result.maxRows}건까지만 보여요. 기간이나 조건을 좁혀
              물어보세요.
            </p>
          )}

          {answer.kind === 'CLARIFICATION' && answer.clarification && (
            <SuggestionList
              title={
                answer.clarification.hasMore
                  ? '밴드 곡 목록에 있는 이름 중 일부예요. 원하는 이름이 없으면 곡에 등록한 이름 그대로 따옴표로 넣어 물어보세요'
                  : '밴드 곡 목록에 있는 이름이에요. 누르면 이 이름으로 다시 물어봐요'
              }
              items={answer.clarification.candidates.map((candidate) => ({
                key: candidate.name,
                label: candidate.name,
                onSelect: () =>
                  onAsk({ question: candidate.question }, candidate.question),
              }))}
              emphasized
            />
          )}

          {FALLBACK_TITLE[answer.kind] && (
            <SuggestionList
              title={FALLBACK_TITLE[answer.kind] ?? ''}
              items={presets.map((preset) => ({
                key: preset.id,
                label: preset.question,
                onSelect: () => askPreset(preset),
              }))}
            />
          )}

          {answer.kind === 'ANSWER' && otherPresets.length > 0 && (
            <SuggestionList
              title="이어서 물어보기"
              items={otherPresets.slice(0, MAX_FOLLOW_UPS).map((preset) => ({
                key: preset.id,
                label: preset.question,
                onSelect: () => askPreset(preset),
              }))}
            />
          )}
        </>
      )}
    </article>
  );
};

const LoadingState = () => {
  const [stage, setStage] = useState(0);

  // 화면에 남아 있는 동안만 단계 문구를 넘긴다. 응답이 오면 이 컴포넌트가 사라진다.
  useEffect(() => {
    const timers = LOADING_STAGES.slice(1).map(({ after }, index) =>
      setTimeout(() => setStage(index + 1), after),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col gap-3" role="status">
      <p className="typo-sm-r text-grey-200">{LOADING_STAGES[stage].text}</p>
      <div aria-hidden="true" className="flex flex-col gap-2">
        <span className="h-5 w-2/3 animate-pulse rounded-md bg-grey-500/24" />
        <span className="h-16 w-full animate-pulse rounded-xl bg-grey-500/24" />
      </div>
    </div>
  );
};

/**
 * 0건·한 건·상위 N개는 결과 영역이 답을 말하므로, 같은 내용을 다시 읽는 요약 대신 결과 제목을 헤드라인으로 쓴다.
 * 여러 건 목록은 개수가 담긴 요약("미응답 10명")을 그대로 쓴다.
 */
const headline = (answer: AssistantAnswer): string => {
  const result = answer.result;
  if (answer.kind !== 'ANSWER' || result?.entity !== 'table' || !result.title)
    return answer.summary;
  return result.rows.length <= 1 || result.resultMode === 'TOP_N'
    ? result.title
    : answer.summary;
};

const errorMessage = (error: unknown): string =>
  axios.isAxiosError(error) && error.response?.status === TOO_MANY_REQUESTS
    ? '질문을 너무 자주 보냈어요. 잠시 후 다시 물어봐 주세요.'
    : '지금은 답을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.';
