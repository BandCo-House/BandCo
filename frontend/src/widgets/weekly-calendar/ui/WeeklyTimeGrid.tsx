import { useRef, useEffect, useMemo } from 'react';
import { getWeekDays } from '@/shared/lib/date';
import { type SchedulePart } from '@/entities/schedule/lib/split-schedule';
import { ScheduleCard } from './ScheduleCard';

interface WeeklyTimeGridProps {
  startDate: Date;
  onSlotClick?: (date: Date) => void;
  onScheduleClick?: (scheduleId: string) => void;
  schedules?: SchedulePart[];
  zoomLevel?: number;
  slotHeight?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export const WeeklyTimeGrid = ({
  startDate,
  onSlotClick,
  onScheduleClick,
  schedules = [],
  zoomLevel = 1,
  slotHeight = 64,
  onZoomIn,
  onZoomOut,
}: WeeklyTimeGridProps) => {
  const weekDays = getWeekDays(startDate);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef(0);

  // 00:00부터 23:00까지의 시간 배열
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // 줌 레벨에 따른 CSS 변수 설정
  const style = useMemo(
    () => ({ '--slot-height': `${slotHeight}px` }) as React.CSSProperties,
    [slotHeight],
  );

  // 특정 날짜의 일정 필터링
  const getSchedulesByDate = (date: Date) => {
    // 주의: 로컬 시간대와 ISO 문자열 불일치 가능성이 있으므로 전처리 로직과 일치시켜야 함
    // 하지만 일단 로컬 시간을 기준으로 split-schedule을 수정했으니, 여기서도 로컬 기준으로 변환
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;

    return schedules.filter((s) => s.date === localDateStr);
  };

  // 키보드 단축키 (+, -)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력창이 활성화된 상태면 무시
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName))
        return;

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
    <div
      className="flex flex-1 flex-col overflow-hidden shadow-xl/5"
      style={style}
    >
      <div className="sticky top-0 z-10 grid h-12.5 grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-border bg-background/40">
        <div className="border-r border-border"></div>
        {weekDays.map((day, index) => {
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <div
              key={index}
              className="flex w-full flex-col items-center justify-center gap-1 border-r border-border text-center last:border-r-0"
            >
              <div className="text-sm-r text-muted">
                {
                  ['월', '화', '수', '목', '금', '토', '일'][
                    day.getDay() === 0 ? 6 : day.getDay() - 1
                  ]
                }
              </div>
              <div
                className={`text-sm-sb flex h-5 w-8 items-center justify-center rounded-full transition-colors ${
                  isToday
                    ? 'bg-primary text-secondary-surface'
                    : 'text-foreground'
                }`}
                data-testid="day-label"
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Body: 시간 레이블 + 슬롯 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-scroll max-h-200"
      >
        <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] gap-x-0.5">
          <div className="flex w-16 flex-col border-r border-border bg-background/40">
            {hours.map((hour) => {
              let minuteInterval = 60;
              if (zoomLevel >= 9) minuteInterval = 5;
              else if (zoomLevel >= 7) minuteInterval = 15;
              else if (zoomLevel >= 4) minuteInterval = 30;

              const minutes = Array.from(
                { length: 60 / minuteInterval },
                (_, i) => i * minuteInterval,
              );

              return (
                <div
                  key={`time-${hour}`}
                  className="relative h-(--slot-height) border-b border-border text-muted transition-[height] duration-200"
                >
                  {minutes.map((minute) => (
                    <div
                      key={`${hour}-${minute}`}
                      className="text-xs-r absolute w-full pr-2 text-right"
                      style={{
                        top: minute === 0 ? '4px' : `${(minute / 60) * 100}%`,
                        opacity: minute === 0 ? 1 : 0.6,
                        fontWeight: minute === 0 ? '500' : '400',
                        display:
                          zoomLevel < 4 && minute !== 0 ? 'none' : 'block',
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
              className="relative flex flex-col border-t bg-background"
            >
              {getSchedulesByDate(day).map((part, i) => (
                <ScheduleCard
                  key={`${part.schedule.scheduleId}-${i}`}
                  part={part}
                  slotHeight={slotHeight}
                  onClick={(id) => onScheduleClick?.(id)}
                />
              ))}

              {hours.map((hour) => {
                let gridInterval = 60;
                if (zoomLevel >= 9) gridInterval = 5;
                else if (zoomLevel >= 7) gridInterval = 15;
                else if (zoomLevel >= 4) gridInterval = 30;

                const subSlotCount = 60 / gridInterval;
                const subSlots = Array.from({ length: subSlotCount });

                return (
                  <div
                    key={`slot-${dayIndex}-${hour}`}
                    className="relative h-(--slot-height) border-b border-destructive-surface"
                  >
                    <div className="absolute inset-0 flex flex-col pointer-events-none">
                      {subSlots.map((_, idx) => (
                        <div
                          key={idx}
                          className={`flex-1 ${idx !== subSlots.length - 1 ? 'border-b border-destructive-surface' : ''}`}
                        />
                      ))}
                    </div>

                    <div
                      data-testid="time-slot"
                      onClick={(e) => {
                        const rect = (
                          e.currentTarget as HTMLDivElement
                        ).getBoundingClientRect();
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
                      className="absolute inset-0 transition-colors duration-200"
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
