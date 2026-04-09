import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { getStartOfWeek, addDays } from '@/shared/lib/date';
import { useSchedules } from '@/entities/schedule/model/queries';
import { ScheduleCreateModal } from '@/features/schedule-create/ui/ScheduleCreateModal';
import { WeeklyCalendarHeader } from './WeeklyCalendarHeader';
import { WeeklyTimeGrid } from './WeeklyTimeGrid';
import { useCalendarZoom } from '../model/use-calendar-zoom';

export const WeeklyCalendar = () => {
  const { bandId } = useParams({ strict: false });
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleScheduleClick = (id: string) => {
    console.log('Schedule clicked:', id);
    // TODO: 상세보기 모달 오픈 로직 추가 예정
  };

  return (
    <div className="flex h-full w-full flex-col">
      <WeeklyCalendarHeader
        currentDate={currentDate}
        onPrev={handlePrevWeek}
        onNext={handleNextWeek}
        onToday={handleToday}
        onAddClick={handleOpenModal}
      />
      <div className="relative flex-1 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
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

      <ScheduleCreateModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialDate={currentDate}
      />
    </div>
  );
};
