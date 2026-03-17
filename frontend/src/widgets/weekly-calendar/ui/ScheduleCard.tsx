import { type SchedulePart } from '@/entities/schedule/lib/split-schedule';
import { useScheduleLayout } from '../model/use-schedule-layout';

interface ScheduleCardProps {
  part: SchedulePart;
  slotHeight: number;
  onClick: (scheduleId: string) => void;
}

const THEMES: Record<string, string> = {
  PRACTICE: 'bg-primary-surface text-primary-main border-primary-light',
  MEETING: 'bg-secondary-surface text-secondary-main border-secondary-light',
};

export const ScheduleCard = ({
  part,
  slotHeight,
  onClick,
}: ScheduleCardProps) => {
  const { schedule, startTime, endTime, partIndex, totalParts } = part;
  const { top, height } = useScheduleLayout({
    startTime,
    endTime,
    slotHeight,
  });

  const isContinued = partIndex > 0;
  const isLastPart = partIndex === totalParts - 1;

  // 시간 표시 포맷팅
  const getTimeDisplay = () => {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}.${day}`;
    };

    // 자정을 넘기는 일정의 첫 번째 조각
    if (partIndex === 0 && totalParts > 1) {
      return `${formatDate(schedule.startAt)} ${startTime} ~`;
    }
    
    // 중간 조각 (하루 종일 이어짐)
    if (isContinued && !isLastPart) {
      return '00:00 ~';
    }

    // 마지막 조각 (자정을 넘긴 일정의 끝)
    if (isLastPart && totalParts > 1) {
      return `~ ${formatDate(schedule.endAt)} ${endTime}`;
    }

    // 일반 당일 일정
    return `${startTime} - ${endTime === '24:00' ? '00:00' : endTime}`;
  };

  return (
    <div
      className={`absolute left-1 right-1 px-2 py-1.5 rounded-[4px] border-l-[3px] shadow-sm cursor-pointer overflow-hidden flex flex-col gap-0.5 z-[1] hover:brightness-95 transition-all ${
        THEMES[schedule.scheduleType] || 'bg-gray-100 text-gray-700 border-gray-300'
      } ${isContinued ? 'opacity-90 border-dashed' : ''}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(schedule.scheduleId);
      }}
    >
      {!isContinued ? (
        <div className="text-[11px] font-bold leading-tight truncate">
          {schedule.ui.cardTitle}
        </div>
      ) : (
        <div className="text-[10px] italic opacity-70 leading-tight">
          (계속)
        </div>
      )}
      <div className="text-[10px] opacity-80 font-medium leading-tight truncate">
        {getTimeDisplay()}
      </div>
    </div>
  );
};
