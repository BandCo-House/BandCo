import { type SchedulePart } from '@/entities/schedule/lib/split-schedule';
import { useScheduleLayout } from '../model/use-schedule-layout';

interface ScheduleCardProps {
  part: SchedulePart;
  slotHeight: number;
  onClick: (scheduleId: string) => void;
}

const THEMES: Record<string, string> = {
  PRACTICE: 'bg-secondary-surface text-primary-main border-primary-light',
  MEETING: 'bg-success-surface text-secondary-main border-secondary-light',
};

export const ScheduleCard = ({
  part,
  slotHeight,
  onClick,
}: ScheduleCardProps) => {
  const {
    schedule,
    startTime,
    endTime,
    partIndex,
    totalParts,
    column,
    totalColumns,
  } = part;
  const { top, height, left, width } = useScheduleLayout({
    startTime,
    endTime,
    slotHeight,
    column,
    totalColumns,
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

    if (partIndex === 0 && totalParts > 1) {
      return `${formatDate(schedule.startAt)} ${startTime} ~`;
    }

    if (isContinued && !isLastPart) {
      return '00:00 ~';
    }

    if (isLastPart && totalParts > 1) {
      return `~ ${formatDate(schedule.endAt)} ${endTime}`;
    }

    return `${startTime} - ${endTime === '24:00' ? '00:00' : endTime}`;
  };

  return (
    <div
      className="absolute rounded-[4px] cursor-pointer z-[1] hover:z-50 group/card transition-all duration-200 ease-in-out"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left,
        width,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(schedule.scheduleId);
      }}
    >
      <div
        className={`border-t-accent border-t border-b border-b-accent w-full h-full min-h-[inherit] px-2 py-1.5 rounded-[4px] shadow-sm flex flex-col gap-0.5 transition-all duration-300 group-hover/card:min-w-[180px] group-hover/card:min-h-[max(100%,100px)] group-hover/card:h-fit group-hover/card:shadow-2xl  ${
          THEMES[schedule.scheduleType] ||
          'bg-gray-100 text-gray-700 border-gray-300'
        } ${isContinued ? 'opacity-90 border-dashed' : ''}`}
      >
        {!isContinued ? (
          <div className="text-[11px] font-bold leading-tight truncate group-hover/card:whitespace-normal">
            {schedule.ui.cardTitle}
          </div>
        ) : (
          <div className="text-[10px] italic opacity-70 leading-tight">
            (계속)
          </div>
        )}
        <div className="text-[10px] opacity-80 font-medium leading-tight truncate group-hover/card:whitespace-normal">
          {getTimeDisplay()}
        </div>

        {/* 추가 정보 (호버 시에만 명확히 노출) */}
        <div className="hidden group-hover/card:flex flex-col gap-1 text-[9px] mt-1 opacity-70 border-t border-current pt-1">
          {schedule.place?.name && (
            <p className="truncate">📍 {schedule.place.name}</p>
          )}
          {schedule.practice && (
            <p className="truncate">
              🎸 {schedule.practice.artistName} ({schedule.practice.team.name})
            </p>
          )}
          {schedule.meeting && (
            <p>👥 참여자 {schedule.meeting.participantCount}명</p>
          )}
          {schedule.memo && (
            <p className="italic mt-0.5 opacity-60">" {schedule.memo} "</p>
          )}
        </div>
      </div>
    </div>
  );
};
