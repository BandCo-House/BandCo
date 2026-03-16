import { getStartOfWeek, addDays, formatWeekRange } from '@/shared/lib/date';
import { IconMap } from '@/constants/icons';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Assuming lucide-react is used for simple arrows
import { Button } from '@/shared/ui/button';

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

  // 디자인에 맞춰 "M월 D일 - M월 D일" 포맷으로 변경 필요할 수 있으나 일단 기존 함수 유지
  const weekRangeText = formatWeekRange(startOfWeek, endOfWeek);

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-inherit border-b border-gray-100">
      <div className="flex items-center gap-6">
        {/* 달력 아이콘 */}
        <div
          className="flex items-center justify-center cursor-pointer hover:bg-gray-200 rounded p-1 transition-colors"
          onClick={onToday}
          title="오늘로 이동"
        >
          <IconMap.Calendar width={24} height={24} className="" />
        </div>

        {/* 날짜 네비게이션 */}
        <div className="flex items-center gap-3 w-90 justify-between">
          <Button
            onClick={onPrev}
            size={'icon'}
            className="w-9 h-8 bg-white  border-gray-200 rounded-[8px] hover:bg-gray-50 "
          >
            <ChevronLeft size={16} className="stroke-primary-light " />
          </Button>

          <h2 className="text-[17px] font-bold text-gray-800 tracking-tight min-w-37.5 text-center">
            {weekRangeText}
          </h2>

          <Button
            onClick={onNext}
            size={'icon'}
            className="w-9 h-8 bg-white border-gray-200 rounded-[8px] hover:bg-gray-50 "
          >
            <ChevronRight size={16} className="stroke-primary-light" />
          </Button>
        </div>
      </div>

      {/* 일정 추가 버튼 */}
      <button className="flex items-center gap-1.5 px-4 py-2 bg-accent border border-accent-surface hover:bg-[#b83c3c] text-secondary rounded-full transition-colors shadow-sm">
        일정 <IconMap.Add width={14} height={14} className="text-secondary" />
      </button>
    </div>
  );
};
