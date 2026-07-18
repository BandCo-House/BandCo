import { SlidersHorizontal } from 'lucide-react';
import { Checkbox } from '@/shared/ui/checkbox';
import { cn } from '@/shared/lib/utils';
import { SCHEDULE_TYPE_OPTIONS, type ScheduleTypeFilter } from '../model/types';

interface ScheduleFilterBarProps {
  scheduleType: ScheduleTypeFilter;
  onScheduleTypeChange: (value: ScheduleTypeFilter) => void;
  onlyMine: boolean;
  onOnlyMineChange: (value: boolean) => void;
  /** 상세 필터(곡·장소) 화면 열기. */
  onDetailFilterOpen?: () => void;
  className?: string;
}

const ONLY_MINE_ID = 'schedule-filter-only-mine';

/**
 * 합주 메인 일정 필터: 유형 칩(전체/합주/회의) + "내가 포함된 일정만 보기" 체크박스.
 * 상태는 상위(위젯)에서 주입받아 제어한다.
 */
export const ScheduleFilterBar = ({
  scheduleType,
  onScheduleTypeChange,
  onlyMine,
  onOnlyMineChange,
  onDetailFilterOpen,
  className,
}: ScheduleFilterBarProps) => {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center gap-2">
        {SCHEDULE_TYPE_OPTIONS.map((option) => {
          const isSelected = scheduleType === option.value;
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onScheduleTypeChange(option.value)}
              className={cn(
                'rounded-full px-4 py-2 typo-sm-sb transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-key',
                isSelected
                  ? 'bg-primary text-gradient-top'
                  : 'border border-grey-400 bg-grey-500/24 text-grey-100',
              )}
            >
              {option.label}
            </button>
          );
        })}

        {/* 상세 필터(곡·장소) 화면 열기 */}
        <button
          type="button"
          aria-label="상세 필터"
          onClick={onDetailFilterOpen}
          className={cn(
            'flex h-9 items-center justify-center rounded-full bg-primary px-4 text-gradient-top',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-key',
          )}
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id={ONLY_MINE_ID}
          checked={onlyMine}
          onCheckedChange={(checked) => onOnlyMineChange(checked === true)}
        />
        <label htmlFor={ONLY_MINE_ID} className="typo-sm-m text-grey-100">
          내가 포함된 일정만 보기
        </label>
      </div>
    </div>
  );
};
