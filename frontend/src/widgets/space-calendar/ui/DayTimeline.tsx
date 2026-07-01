import type { CSSProperties } from 'react';
import { type DayScheduleBlock } from '@/entities/schedule/lib/day-window';
import { cn } from '@/shared/lib/utils';
import { DayScheduleCard } from './DayScheduleCard';

interface DayTimelineProps {
  blocks: DayScheduleBlock[];
  onScheduleClick?: (scheduleId: string) => void;
  className?: string;
}

const SLOT_HEIGHT = 64;
const START_HOUR = 6;
const HOUR_COUNT = 24;
const TOP_PADDING = 12;
const BOTTOM_PADDING = 16;

// 양끝 06:00을 모두 표시하려고 25개(0~24)
const HOUR_LABELS = Array.from({ length: HOUR_COUNT + 1 }, (_, offset) => ({
  offset,
  hour: (START_HOUR + offset) % 24,
}));

const SCROLLBAR_CLASSES = cn(
  '[scrollbar-color:var(--primary-main)_transparent] [scrollbar-width:thin]',
  '[&::-webkit-scrollbar]:h-1.5',
  '[&::-webkit-scrollbar-track]:bg-transparent',
  '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary',
);

/** 하루(06:00~다음 날 06:00) 세로 타임라인. 겹침이 폭을 넘으면 일정 영역만 가로 스크롤. */
export const DayTimeline = ({
  blocks,
  onScheduleClick,
  className,
}: DayTimelineProps) => {
  const maxColumns = blocks.reduce(
    (max, block) => Math.max(max, block.totalColumns ?? 1),
    1,
  );

  const contentHeight = TOP_PADDING + HOUR_COUNT * SLOT_HEIGHT + BOTTOM_PADDING;

  const trackStyle = {
    '--track-w': '100cqw',
    '--day-cols': maxColumns,
    height: contentHeight,
    width: 'calc(var(--day-cols) * var(--track-w) / min(var(--day-cols), 2))',
  } as CSSProperties;

  return (
    <div className={cn('flex', className)} style={{ height: contentHeight }}>
      <div className="relative w-14 shrink-0">
        {HOUR_LABELS.map(({ offset, hour }) => (
          <span
            key={offset}
            style={{ top: TOP_PADDING + offset * SLOT_HEIGHT - 8 }}
            className="absolute right-2 typo-xs-m text-grey-200"
          >
            {`${String(hour).padStart(2, '0')}:00`}
          </span>
        ))}
      </div>

      {/* 가로 스크롤만 담당하는 일정 영역(시간 레이블과 분리) */}
      <div
        className={cn(
          '[container-type:inline-size] min-w-0 flex-1 overflow-x-auto overflow-y-hidden',
          SCROLLBAR_CLASSES,
        )}
      >
        <div className="relative" style={trackStyle}>
          {blocks.length === 0 ? (
            <p
              className="absolute inset-x-0 text-center typo-sm-r text-grey-300"
              style={{ top: TOP_PADDING + 80 }}
            >
              등록된 일정이 없어요.
            </p>
          ) : (
            blocks.map((block, index) => (
              <DayScheduleCard
                key={`${block.schedule.scheduleId}-${index}`}
                block={block}
                slotHeight={SLOT_HEIGHT}
                topOffset={TOP_PADDING}
                onClick={onScheduleClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
