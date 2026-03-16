import { useRef, useEffect, useMemo } from 'react';
import { getWeekDays } from '@/shared/lib/date';

interface WeeklyTimeGridProps {
  startDate: Date;
  onSlotClick?: (date: Date) => void;
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

  // 키보드 단축키 (+, -)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력창이 활성화된 상태면 무시
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === '+' || e.key === '=') {
        onZoomIn?.();
      } else if (e.key === '-' || e.key === '_') {
        onZoomOut?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onZoomIn, onZoomOut]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
// ... rest of use-effect remains same

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
            {hours.map((hour) => {
              // 줌 레벨에 따라 표시할 분 단위 결정
              let minuteInterval = 60;
              if (zoomLevel >= 9) minuteInterval = 5;
              else if (zoomLevel >= 7) minuteInterval = 15;
              else if (zoomLevel >= 4) minuteInterval = 30;

              const minutes = Array.from(
                { length: 60 / minuteInterval },
                (_, i) => i * minuteInterval
              );

              return (
                <div
                  key={`time-${hour}`}
                  className="h-[var(--slot-height)] border-b relative text-muted-foreground transition-[height] duration-200"
                >
                  {minutes.map((minute) => (
                    <div
                      key={`${hour}-${minute}`}
                      className="absolute w-full text-center text-[9px] leading-none"
                      style={{ 
                        top: `${(minute / 60) * 100}%`,
                        transform: 'translateY(-50%)',
                        paddingTop: minute === 0 ? '4px' : '0',
                        opacity: minute === 0 ? 1 : 0.6,
                        fontWeight: minute === 0 ? '600' : '400',
                        display: (zoomLevel < 4 && minute !== 0) ? 'none' : 'block'
                      }}
                    >
                      {`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* 7일간의 시간 슬롯 (7 Columns) */}
          {weekDays.map((day, dayIndex) => (
            <div
              key={`col-${dayIndex}`}
              className="flex flex-col border-r last:border-r-0"
            >
              {hours.map((hour) => {
                // 그리드 보조선 밀도 결정
                let gridInterval = 60;
                if (zoomLevel >= 9) gridInterval = 5;
                else if (zoomLevel >= 7) gridInterval = 15;
                else if (zoomLevel >= 4) gridInterval = 30;

                const lineCount = 60 / gridInterval;
                const percentage = 100 / lineCount;

                return (
                  <div
                    key={`slot-${dayIndex}-${hour}`}
                    data-testid="time-slot"
                    onClick={(e) => {
                      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                      const offsetY = e.clientY - rect.top;
                      const totalHeight = rect.height;
                      
                      let minutes = Math.floor((offsetY / totalHeight) * 60);
                      const roundTo = zoomLevel >= 9 ? 5 : 15;
                      minutes = Math.round(minutes / roundTo) * roundTo;
                      if (minutes >= 60) minutes = 55;

                      const clickedDate = new Date(day);
                      clickedDate.setHours(hour, minutes, 0, 0);
                      onSlotClick?.(clickedDate);
                    }}
                    className="h-[var(--slot-height)] border-b border-dashed hover:bg-muted/50 cursor-pointer transition-[height,background-color] duration-200 relative"
                    style={{
                      backgroundImage: gridInterval < 60
                        ? `repeating-linear-gradient(to bottom, transparent, transparent calc(${percentage}% - 1px), rgba(0,0,0,0.1) calc(${percentage}% - 1px), rgba(0,0,0,0.1) ${percentage}%)`
                        : 'none',
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
