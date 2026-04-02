import { getStartOfWeek, addDays, formatWeekRange } from '@/shared/lib/date';
import { IconMap } from '@/constants/icons';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Assuming lucide-react is used for simple arrows
import { Button } from '@/shared/ui/button';

interface WeeklyCalendarHeaderProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddClick: () => void;
}

export const WeeklyCalendarHeader = ({
  currentDate,
  onPrev,
  onNext,
  onToday,
  onAddClick,
}: WeeklyCalendarHeaderProps) => {
  const startOfWeek = getStartOfWeek(currentDate);
  const endOfWeek = addDays(startOfWeek, 6);

  // 디자인에 맞춰 "M월 D일 - M월 D일" 포맷으로 변경 필요할 수 있으나 일단 기존 함수 유지
  const weekRangeText = formatWeekRange(startOfWeek, endOfWeek);

  return (
    <div className="flex items-center justify-between border-b border-border bg-inherit px-6 py-4">
      <div className="flex items-center gap-6">
        <button
          type="button"
          className="rounded-md p-1 transition-colors hover:bg-muted"
          onClick={onToday}
          title="오늘로 이동"
        >
          <IconMap.Calendar width={24} height={24} className="" />
        </button>

        <div className="flex w-full max-w-sm items-center justify-between gap-3">
          <Button
            onClick={onPrev}
            size={'icon'}
            variant="outline"
            aria-label="이전 주"
            className="size-9 rounded-md bg-background hover:bg-muted"
          >
            <ChevronLeft size={16} className="stroke-primary-light" />
          </Button>

          <h2 className="text-lg-b min-w-0 flex-1 text-center text-foreground">
            {weekRangeText}
          </h2>

          <Button
            onClick={onNext}
            size={'icon'}
            variant="outline"
            aria-label="다음 주"
            className="size-9 rounded-md bg-background hover:bg-muted"
          >
            <ChevronRight size={16} className="stroke-primary-light" />
          </Button>
        </div>
      </div>

      <Button
        onClick={onAddClick}
        className="bg-accent text-secondary hover:bg-accent-light"
      >
        일정 <IconMap.Add width={14} height={14} className="text-secondary" />
      </Button>
    </div>
  );
};
