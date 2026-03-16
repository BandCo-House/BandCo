import { getStartOfWeek, addDays, formatWeekRange } from '@/shared/lib/date';
import { IconMap } from '@/constants/icons';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Assuming lucide-react is used for simple arrows

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
    <div className="flex items-center justify-between px-6 py-4  border-b border-gray-100">
      <div className="flex items-center gap-6">
        {/* 달력 아이콘 */}
        <div 
          className="flex items-center justify-center cursor-pointer hover:bg-gray-200 rounded p-1 transition-colors"
          onClick={onToday}
          title="오늘로 이동"
        >
          <IconMap.Calendar width={24} height={24} className="text-gray-700" />
        </div>

        {/* 날짜 네비게이션 */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            className="flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded text-gray-500 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>
          
          <h2 className="text-[17px] font-bold text-gray-800 tracking-tight min-w-[150px] text-center">
            {weekRangeText}
          </h2>
          
          <button
            onClick={onNext}
            className="flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded text-gray-500 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 일정 추가 버튼 */}
      <button className="flex items-center gap-1.5 px-4 py-2 bg-[#d34a4a] hover:bg-[#b83c3c] text-white text-sm font-medium rounded-full transition-colors shadow-sm">
        일정 <IconMap.Add width={14} height={14} className="text-white" />
      </button>
    </div>
  );
};
