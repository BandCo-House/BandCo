import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { getStartOfWeek, addDays } from '@/shared/lib/date';
import { useSchedules } from '@/entities/schedule/model/queries';
import { WeeklyCalendarHeader } from './WeeklyCalendarHeader';
import { WeeklyTimeGrid } from './WeeklyTimeGrid';
import { useCalendarZoom } from '../model/use-calendar-zoom';

export const WeeklyCalendar = () => {
  const { bandId } = useParams({ strict: false });
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const { zoomLevel, slotHeight, zoomIn, zoomOut } = useCalendarZoom();

  const startOfWeek = getStartOfWeek(currentDate);
  const endOfWeek = addDays(startOfWeek, 6);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const { data: schedules = [], isLoading } = useSchedules(
    bandId || '',
    formatDate(startOfWeek),
    formatDate(endOfWeek),
  );

  const handlePrevWeek = () => setCurrentDate((prev) => addDays(prev, -7));
  const handleNextWeek = () => setCurrentDate((prev) => addDays(prev, 7));
  const handleToday = () => setCurrentDate(new Date());

  const handleScheduleClick = (id: string) => {
    console.log('Schedule clicked:', id);
    // TODO: 상세보기 모달 오픈 로직 추가 예정
  };

  return (
    <div className="flex flex-col w-full h-full">
      <WeeklyCalendarHeader
        currentDate={currentDate}
        onPrev={handlePrevWeek}
        onNext={handleNextWeek}
        onToday={handleToday}
      />
      <div className="relative flex-1 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-main" />
          </div>
        )}
        <WeeklyTimeGrid
          startDate={startOfWeek}
          schedules={schedules}
          onScheduleClick={handleScheduleClick}
          zoomLevel={zoomLevel}
          slotHeight={slotHeight}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
        />
      </div>
    </div>
  );
};
