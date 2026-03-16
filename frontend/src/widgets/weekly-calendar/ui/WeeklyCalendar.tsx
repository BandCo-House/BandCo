import { useState } from 'react';
import { getStartOfWeek, addDays } from '@/shared/lib/date';
import { WeeklyCalendarHeader } from './WeeklyCalendarHeader';
import { WeeklyTimeGrid } from './WeeklyTimeGrid';
import { useCalendarZoom } from '../model/use-calendar-zoom';

export const WeeklyCalendar = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const { zoomLevel, slotHeight, zoomIn, zoomOut } = useCalendarZoom();

  const startOfWeek = getStartOfWeek(currentDate);

  const handlePrevWeek = () => setCurrentDate((prev) => addDays(prev, -7));
  const handleNextWeek = () => setCurrentDate((prev) => addDays(prev, 7));
  const handleToday = () => setCurrentDate(new Date());

  return (
    <div className="flex flex-col w-full h-full">
      <WeeklyCalendarHeader
        currentDate={currentDate}
        onPrev={handlePrevWeek}
        onNext={handleNextWeek}
        onToday={handleToday}
      />
      <WeeklyTimeGrid
        startDate={startOfWeek}
        zoomLevel={zoomLevel}
        slotHeight={slotHeight}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
      />
    </div>
  );
};
