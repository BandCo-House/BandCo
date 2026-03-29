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
      className="flex flex-col flex-1 overflow-hidden rounded-[8px] shadow-xl/5"
      style={style}
    >
      {/* Header: 요일 및 날짜 */}
      <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-gray-100 bg-[#FFFFFF66] sticky top-0 z-10 h-12.5">
        {/* 좌상단 빈칸 */}
        <div className="border-r border-gray-100"></div>
        {weekDays.map((day, index) => {
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <div
              key={index}
              className=" text-center border-r border-gray-100 last:border-r-0 flex flex-col items-center gap-1 justify-center w-full"
            >
              <div className="font-normal text-sm text-gray-400">
                {
                  ['월', '화', '수', '목', '금', '토', '일'][
                    day.getDay() === 0 ? 6 : day.getDay() - 1
                  ]
                }
              </div>
              <div
                className={`w-8 h-5 flex items-center justify-center rounded-full transition-colors text-sm font-semibold ${
                  isToday
                    ? 'bg-primary text-secondary-surface'
                    : 'text-gray-700'
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
          {/* 시간 레이블 (1 Column) */}
          <div className="flex flex-col border-r border-gray-100 bg-[#FFFFFF66] w-16">
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
                  className="h-(--slot-height) border-b border-gray-100 relative text-gray-400 transition-[height] duration-200"
                >
                  {minutes.map((minute) => (
                    <div
                      key={`${hour}-${minute}`}
                      className="absolute w-full pr-2 text-right text-[10px] leading-none"
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
              className="flex flex-col border-last:border-r-0 border-t bg-white relative"
            >
              {/* 일정 카드 렌더링 */}
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
                    className="h-(--slot-height) border-b border-rose-200 relative"
                  >
                    {/* 정밀 그리드 선 (좌측 레이블과 완벽히 일치, 빨간색 계열) */}
                    <div className="absolute inset-0 flex flex-col pointer-events-none">
                      {subSlots.map((_, idx) => (
                        <div
                          key={idx}
                          className={`flex-1 ${idx !== subSlots.length - 1 ? 'border-b border-destructive-surface' : ''}`}
                        />
                      ))}
                    </div>

                    {/* 클릭 가능한 영역 */}
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
