import { useRef, useEffect, useMemo } from 'react';
import { getWeekDays } from '@/shared/lib/date';

interface WeeklyTimeGridProps {
  startDate: Date;
  onSlotClick?: (date: Date, hour: number) => void;
  zoomLevel?: number;
  slotHeight?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export const WeeklyTimeGrid = ({
  startDate,
  onSlotClick,
  zoomLevel = 1,
  slotHeight = 64,
  onZoomIn,
  onZoomOut,
}: WeeklyTimeGridProps) => {
  const weekDays = getWeekDays(startDate);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef(0);

  // 01:00부터 24:00까지의 시간 배열
  const hours = Array.from({ length: 24 }, (_, i) => i + 1);

  // 줌 레벨에 따른 CSS 변수 설정
  const style = useMemo(
    () => ({ '--slot-height': `${slotHeight}px` } as React.CSSProperties),
    [slotHeight]
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();

        // 쓰로틀링: 약 30ms 간격
        const now = Date.now();
        if (now - lastWheelTime.current < 30) return;
        lastWheelTime.current = now;

        const isZoomIn = e.deltaY < 0;
        
        // 줌 전의 마우스 위치 및 전체 높이 정보 저장
        const rect = container.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        const currentScrollTop = container.scrollTop;
        const currentTotalHeight = container.scrollHeight;
        
        // 마우스 커서의 캘린더 내부 상대 위치 (%)
        const relY = (mouseY + currentScrollTop) / currentTotalHeight;

        // 줌 실행
        if (isZoomIn) {
          onZoomIn?.();
        } else {
          onZoomOut?.();
        }

        // 줌 이후 스크롤 위치 보정 (requestAnimationFrame 사용)
        requestAnimationFrame(() => {
          const newTotalHeight = container.scrollHeight;
          const newScrollTop = relY * newTotalHeight - mouseY;
          container.scrollTop = newScrollTop;
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [onZoomIn, onZoomOut]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={style}>
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
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="grid grid-cols-8">
          {/* 시간 레이블 (1 Column) */}
          <div className="flex flex-col border-r bg-muted/20">
            {hours.map((hour) => (
              <div
                key={`time-${hour}`}
                className="h-[var(--slot-height)] border-b flex items-start justify-center p-1 text-xs text-muted-foreground transition-[height] duration-200"
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
                  className="h-[var(--slot-height)] border-b border-dashed hover:bg-muted/50 cursor-pointer transition-[height,background-color] duration-200"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
