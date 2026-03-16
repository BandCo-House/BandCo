import { useState } from 'react';
import { getStartOfWeek, addDays } from '@/shared/lib/date';
import { WeeklyCalendarHeader } from './WeeklyCalendarHeader';
import { WeeklyTimeGrid } from './WeeklyTimeGrid';

export const WeeklyCalendar = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const startOfWeek = getStartOfWeek(currentDate);

  const handlePrevWeek = () => setCurrentDate((prev) => addDays(prev, -7));
  const handleNextWeek = () => setCurrentDate((prev) => addDays(prev, 7));
  const handleToday = () => setCurrentDate(new Date());

  return (
    <div className="flex flex-col w-full h-full border rounded-lg bg-background">
      <WeeklyCalendarHeader
        currentDate={currentDate}
        onPrev={handlePrevWeek}
        onNext={handleNextWeek}
        onToday={handleToday}
      />
      <WeeklyTimeGrid startDate={startOfWeek} />
    </div>
  );
};
