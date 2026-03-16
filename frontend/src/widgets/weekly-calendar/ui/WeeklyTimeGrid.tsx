import { getWeekDays } from '@/shared/lib/date';

interface WeeklyTimeGridProps {
  startDate: Date;
  onSlotClick?: (date: Date, hour: number) => void;
}

export const WeeklyTimeGrid = ({
  startDate,
  onSlotClick,
}: WeeklyTimeGridProps) => {
  const weekDays = getWeekDays(startDate);

  // 01:00부터 24:00까지의 시간 배열
  const hours = Array.from({ length: 24 }, (_, i) => i + 1);

  return (
    <>
      {/* Header: 요일 및 날짜 */}
      <div className="grid grid-cols-8 border-b">
        {/* 좌상단 빈칸 (시간 레이블 위) */}
        <div className="border-r p-2 font-semibold text-center bg-muted/50">
          Time
        </div>

        {weekDays.map((day, index) => {
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <div
              key={index}
              className={`p-2 text-center border-r last:border-r-0 ${
                isToday ? 'bg-primary/10 text-primary font-bold' : ''
              }`}
            >
              <div className="text-sm text-muted-foreground">
                {['일', '월', '화', '수', '목', '금', '토'][day.getDay()]}
              </div>
              <div className="text-lg" data-testid="day-label">
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Body: 시간 레이블 + 슬롯 */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8 h-full">
          {/* 시간 레이블 (1 Column) */}
          <div className="flex flex-col border-r bg-muted/20">
            {hours.map((hour) => (
              <div
                key={`time-${hour}`}
                className="h-16 border-b flex items-start justify-center p-1 text-xs text-muted-foreground"
              >
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* 7일간의 시간 슬롯 (7 Columns) */}
          {weekDays.map((day, dayIndex) => (
            <div
              key={`col-${dayIndex}`}
              className="flex flex-col border-r last:border-r-0"
            >
              {hours.map((hour) => (
                <div
                  key={`slot-${dayIndex}-${hour}`}
                  data-testid="time-slot"
                  onClick={() => onSlotClick?.(day, hour)}
                  className="h-16 border-b border-dashed hover:bg-muted/50 cursor-pointer transition-colors"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
