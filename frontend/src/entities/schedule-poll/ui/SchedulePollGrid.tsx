import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '@/shared/lib/utils';
import type { SchedulePollOption } from '../model/types';
import {
  formatDateColumnLabel,
  pollCellKey,
  type PollDateKey,
} from '../lib/poll-grid';

interface ResultModeProps {
  mode: 'result';
  /** 셀 농도의 분모(최다 득표 수). */
  maxCount: number;
}

interface EditModeProps {
  mode: 'edit';
  selectedIds: string[];
  onToggle: (optionId: string, selected: boolean) => void;
}

type SchedulePollGridProps = {
  /** 이 페이지에 그릴 날짜(열) 목록. */
  dateKeys: PollDateKey[];
  /** 전체 행(후보 시작 시각 'HH:mm') 목록. 페이지가 바뀌어도 행은 같다. */
  timeLabels: string[];
  cells: Map<string, SchedulePollOption>;
} & (ResultModeProps | EditModeProps);

/** 'HH:mm' → '14 : 30' 표기. */
const formatTimeLabel = (time: string): string => time.replace(':', ' : ');

const cellBorderClass = 'border-[0.5px] border-surface-3';

/**
 * 일정 투표 후보 그리드. 열=날짜, 행=30분 단위 시작 시각.
 * result 모드는 후보별 득표 수를 농도로, edit 모드는 드래그로 내 참여 시간을 고른다.
 */
export const SchedulePollGrid = (props: SchedulePollGridProps) => {
  const { dateKeys, timeLabels, cells } = props;
  // 드래그 중 적용할 상태(true=선택, false=해제). null이면 드래그 아님.
  const dragSelectingRef = useRef<boolean | null>(null);

  const isEdit = props.mode === 'edit';
  const selectedSet = isEdit ? new Set(props.selectedIds) : null;

  const optionIdFromPoint = (event: PointerEvent): string | null => {
    const element = document.elementFromPoint(event.clientX, event.clientY);
    return (
      element?.closest('[data-option-id]')?.getAttribute('data-option-id') ??
      null
    );
  };

  const applyDrag = (optionId: string) => {
    if (!isEdit || dragSelectingRef.current === null) return;
    const shouldSelect = dragSelectingRef.current;
    if (selectedSet?.has(optionId) !== shouldSelect) {
      props.onToggle(optionId, shouldSelect);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isEdit) return;
    const optionId = optionIdFromPoint(event);
    if (!optionId) return;
    dragSelectingRef.current = !selectedSet?.has(optionId);
    applyDrag(optionId);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const optionId = optionIdFromPoint(event);
    if (optionId) applyDrag(optionId);
  };

  const endDrag = () => {
    dragSelectingRef.current = null;
  };

  const handleCellKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    optionId: string,
  ) => {
    if (!isEdit) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    props.onToggle(optionId, !selectedSet?.has(optionId));
  };

  return (
    <div className="w-full">
      {/* 날짜(열) 머리글 */}
      <div className="flex w-full">
        <div aria-hidden="true" className="w-14 shrink-0" />
        {dateKeys.map((dateKey) => (
          <p
            key={dateKey}
            className="flex-1 px-1 py-2 text-center typo-xs-r text-grey-300"
          >
            {formatDateColumnLabel(dateKey)}
          </p>
        ))}
      </div>

      <div className="flex w-full">
        {/* 시작 시각(행) 라벨 */}
        <div className="flex w-14 shrink-0 flex-col pr-3">
          {timeLabels.map((time) => (
            <p
              key={time}
              className="flex h-12 items-start justify-end typo-xs-r whitespace-nowrap text-grey-200"
            >
              {formatTimeLabel(time)}
            </p>
          ))}
        </div>

        <div
          role={isEdit ? 'group' : undefined}
          aria-label={isEdit ? '참여 가능한 시간 선택' : undefined}
          className={cn('flex-1 select-none', isEdit && 'touch-none')}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${dateKeys.length}, minmax(0, 1fr))`,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {timeLabels.map((time) =>
            dateKeys.map((dateKey) => {
              const option = cells.get(pollCellKey(dateKey, time));
              if (!option) {
                // 후보가 없는 조합은 비활성 빈 칸으로 그려 행 정렬을 유지한다.
                return (
                  <div
                    key={pollCellKey(dateKey, time)}
                    aria-hidden="true"
                    className={cn('h-12', cellBorderClass)}
                  />
                );
              }

              if (props.mode === 'result') {
                const ratio =
                  props.maxCount > 0 ? option.voteCount / props.maxCount : 0;
                return (
                  <div
                    key={option.schedulePollOptionId}
                    className={cn(
                      'flex h-12 items-center justify-center typo-sm-sb',
                      cellBorderClass,
                      ratio >= 0.5 ? 'text-primary-dark' : 'text-grey-50',
                    )}
                    style={
                      ratio > 0
                        ? {
                            backgroundColor: `color-mix(in srgb, var(--color-primary) ${Math.round(ratio * 100)}%, transparent)`,
                          }
                        : undefined
                    }
                  >
                    {option.voteCount}
                  </div>
                );
              }

              const isSelected = selectedSet?.has(option.schedulePollOptionId);
              return (
                <div
                  key={option.schedulePollOptionId}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={`${formatDateColumnLabel(dateKey)} ${formatTimeLabel(time)}`}
                  tabIndex={0}
                  data-option-id={option.schedulePollOptionId}
                  onKeyDown={(event) =>
                    handleCellKeyDown(event, option.schedulePollOptionId)
                  }
                  className={cn(
                    'h-12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
                    cellBorderClass,
                    isSelected ? 'bg-primary' : 'bg-surface-3',
                  )}
                />
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
};
