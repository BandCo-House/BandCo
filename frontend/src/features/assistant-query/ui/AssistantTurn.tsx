import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/shared/ui/button';
import type {
  AssistantAnswer,
  AssistantPreset,
} from '@/entities/assistant/model/types';
import type { AssistantTurnState } from '../model/assistant-conversation';
import { AssistantResult } from './AssistantResult';
import { SuggestionList } from './SuggestionList';

/** 응답을 기다리는 동안 바꿔 보여줄 단계 문구와 전환 시각(ms) */
const LOADING_STAGES = [
  { after: 0, text: '질문을 이해하고 있어요' },
  { after: 1500, text: '밴드 데이터를 찾고 있어요' },
  { after: 5000, text: '조금만 더 기다려 주세요' },
];
const TOO_MANY_REQUESTS = 429;

/** 답의 각 부분이 위에서부터 차례로 나타나게 한다. 지연 전에는 보이지 않게 fill-mode를 둔다. */
const REVEAL =
  'animate-in fade-in slide-in-from-bottom-1 duration-300 fill-mode-backwards motion-reduce:animate-none';
const REVEAL_DELAY = ['', 'delay-150', 'delay-300', 'delay-500'];

const FALLBACK_TITLE: Partial<Record<AssistantAnswer['kind'], string>> = {
  UNSUPPORTED: '이런 질문은 답할 수 있어요',
  REPHRASE: '이런 질문은 바로 답할 수 있어요',
};

interface AssistantTurnProps {
  turn: AssistantTurnState;
  /** 다음 행동(이어서 물어보기, 예시 질문)은 마지막 턴에만 보여준다. */
  isLatest: boolean;
  presets: AssistantPreset[];
  onFollowUp: (question: string) => void;
  onAskPreset: (preset: AssistantPreset) => void;
  onAskCandidate: (question: string) => void;
  onRetry: () => void;
}

export const AssistantTurn = ({
  turn,
  isLatest,
  presets,
  onFollowUp,
  onAskPreset,
  onAskCandidate,
  onRetry,
}: AssistantTurnProps) => {
  const { answer, pending, error } = turn;

  return (
    <article
      aria-busy={pending}
      className="flex animate-in flex-col gap-4 duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none"
    >
      <p className="max-w-[85%] self-end rounded-sm rounded-br-xs bg-surface-3 px-4 py-2.5 typo-sm-r text-grey-50">
        {turn.label}
      </p>

      {pending && <LoadingState />}

      {!pending && error !== undefined && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="typo-base-r text-grey-100">{errorMessage(error)}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="border-grey-200 text-grey-100"
          >
            다시 시도
          </Button>
        </div>
      )}

      {!pending && answer !== undefined && (
        <div className="flex flex-col gap-4">
          {/* 결론을 먼저 보여주고, 어떻게 찾았는지(조건)와 결과는 그 다음에 나타난다. */}
          <div className={`flex flex-col gap-1.5 ${REVEAL}`}>
            {answer.kind === 'ANSWER' && (
              <p className="typo-xs-r text-grey-300">
                밴드 데이터에서 찾았어요
              </p>
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
          </div>

          {(answer.result !== null || hasConditions(answer)) && (
            <div className={`flex flex-col gap-3 ${REVEAL} ${REVEAL_DELAY[1]}`}>
              {hasConditions(answer) && answer.result?.entity === 'table' && (
                <ul aria-label="조회 조건" className="flex flex-wrap gap-1.5">
                  {answer.result.conditions.map((condition) => (
                    <li
                      key={condition}
                      className="rounded-full bg-surface-3 px-2.5 py-1 typo-xs-r text-grey-200"
                    >
                      {condition}
                    </li>
                  ))}
                </ul>
              )}
              {answer.result !== null && (
                <AssistantResult result={answer.result} />
              )}
              {answer.result?.entity === 'table' && answer.result.hasMore && (
                <p className="typo-sm-r text-grey-300">
                  {answer.result.maxRows}건까지만 보여요. 기간이나 조건을 좁혀
                  물어보세요.
                </p>
              )}
            </div>
          )}

          {isLatest &&
            answer.kind === 'CLARIFICATION' &&
            answer.clarification && (
              <SuggestionList
                className={`${REVEAL} ${REVEAL_DELAY[2]}`}
                title={
                  answer.clarification.hasMore
                    ? '밴드 곡 목록에 있는 이름 중 일부예요. 원하는 이름이 없으면 곡에 등록한 이름 그대로 따옴표로 넣어 물어보세요'
                    : '밴드 곡 목록에 있는 이름이에요. 누르면 이 이름으로 다시 물어봐요'
                }
                items={answer.clarification.candidates.map((candidate) => ({
                  key: candidate.name,
                  label: candidate.name,
                  onSelect: () => onAskCandidate(candidate.question),
                }))}
                emphasized
              />
            )}

          {isLatest && FALLBACK_TITLE[answer.kind] && (
            <SuggestionList
              className={`${REVEAL} ${REVEAL_DELAY[2]}`}
              title={FALLBACK_TITLE[answer.kind] ?? ''}
              items={presets.map((preset) => ({
                key: preset.id,
                label: preset.question,
                onSelect: () => onAskPreset(preset),
              }))}
            />
          )}

          {isLatest &&
            answer.kind === 'ANSWER' &&
            turn.followUps.length > 0 && (
              <SuggestionList
                className={`${REVEAL} ${REVEAL_DELAY[3]}`}
                title="이어서 물어보기"
                items={turn.followUps.map((followUp) => ({
                  key: followUp,
                  label: followUp,
                  onSelect: () => onFollowUp(followUp),
                }))}
              />
            )}
        </div>
      )}
    </article>
  );
};

const TYPING_DOT_DELAYS = [
  '',
  '[animation-delay:150ms]',
  '[animation-delay:300ms]',
];

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
    <div role="status" className={`flex items-center gap-3 ${REVEAL}`}>
      <span
        aria-hidden="true"
        className="flex items-center gap-1 rounded-sm rounded-bl-xs bg-surface-3 px-4 py-3"
      >
        {TYPING_DOT_DELAYS.map((delay) => (
          <span
            key={delay}
            className={`size-1.5 animate-bounce rounded-full bg-grey-200 motion-reduce:animate-none ${delay}`}
          />
        ))}
      </span>
      <span className="typo-sm-r text-grey-300">
        {LOADING_STAGES[stage].text}
      </span>
    </div>
  );
};

const hasConditions = (answer: AssistantAnswer): boolean =>
  answer.kind === 'ANSWER' &&
  answer.result?.entity === 'table' &&
  answer.result.conditions.length > 0;

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
