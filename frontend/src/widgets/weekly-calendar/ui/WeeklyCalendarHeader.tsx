import { getStartOfWeek, addDays, formatWeekRange } from '@/shared/lib/date';

interface WeeklyCalendarHeaderProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const WeeklyCalendarHeader = ({
  currentDate,
  onPrev,
  onNext,
  onToday,
}: WeeklyCalendarHeaderProps) => {
  const startOfWeek = getStartOfWeek(currentDate);
  const endOfWeek = addDays(startOfWeek, 6);

  const weekRangeText = formatWeekRange(startOfWeek, endOfWeek);

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h2 className="text-xl font-bold">{weekRangeText}</h2>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          className="px-3 py-1 text-sm border rounded hover:bg-muted"
        >
          이전 주
        </button>
        <button
          onClick={onToday}
          className="px-3 py-1 text-sm border rounded hover:bg-muted"
        >
          오늘
        </button>
        <button
          onClick={onNext}
          className="px-3 py-1 text-sm border rounded hover:bg-muted"
        >
          다음 주
        </button>
      </div>
    </div>
  );
};
