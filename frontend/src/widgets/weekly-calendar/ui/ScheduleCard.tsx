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
  const { schedule, startTime, endTime } = part;
  const { top, height } = useScheduleLayout({
    startTime,
    endTime,
    slotHeight,
  });

  return (
    <div
      className={`absolute left-1 right-1 px-2 py-1.5 rounded-[4px] border-l-[3px] shadow-sm cursor-pointer overflow-hidden flex flex-col gap-0.5 z-[1] hover:brightness-95 transition-all ${
        THEMES[schedule.scheduleType] || 'bg-gray-100 text-gray-700 border-gray-300'
      }`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(schedule.scheduleId);
      }}
    >
      <div className="text-[11px] font-bold leading-tight truncate">
        {schedule.ui.cardTitle}
      </div>
      <div className="text-[10px] opacity-80 leading-tight truncate">
        {startTime} - {endTime === '24:00' ? '00:00' : endTime}
      </div>
    </div>
  );
};
