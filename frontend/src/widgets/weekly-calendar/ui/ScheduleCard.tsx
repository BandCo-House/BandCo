import { type SchedulePart } from '@/entities/schedule/lib/split-schedule';
import { useScheduleLayout } from '../model/use-schedule-layout';

interface ScheduleCardProps {
  part: SchedulePart;
  slotHeight: number;
  onClick: (scheduleId: string) => void;
}

const THEMES: Record<string, string> = {
  PRACTICE: 'border-primary-light bg-secondary-surface text-foreground',
  MEETING: 'border-success bg-success-surface text-foreground',
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
      className="group/card absolute z-[1] cursor-pointer transition-all duration-200 ease-in-out hover:z-50"
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
        className={`flex h-full min-h-[inherit] w-full flex-col gap-0.5 border-y px-2 py-1.5 shadow-sm transition-all duration-300 group-hover/card:h-fit group-hover/card:min-h-[max(100%,100px)] group-hover/card:min-w-[180px] group-hover/card:shadow-2xl ${
          THEMES[schedule.scheduleType] ||
          'border-border bg-muted text-foreground'
        } ${isContinued ? 'opacity-90 border-dashed' : ''}`}
      >
        {!isContinued ? (
          <div className="text-xs-sb truncate leading-tight group-hover/card:whitespace-normal">
            {schedule.ui.cardTitle}
          </div>
        ) : (
          <div className="text-xs-r leading-tight italic opacity-70">
            (계속)
          </div>
        )}
        <div className="text-xs-m truncate leading-tight opacity-80 group-hover/card:whitespace-normal">
          {getTimeDisplay()}
        </div>

        <div className="text-xs-r mt-1 hidden flex-col gap-1 border-t border-current pt-1 opacity-70 group-hover/card:flex">
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
            <p className="mt-0.5 italic opacity-60">" {schedule.memo} "</p>
          )}
        </div>
      </div>
    </div>
  );
};
