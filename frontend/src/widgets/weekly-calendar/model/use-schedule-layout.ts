import { useMemo } from 'react';

interface UseScheduleLayoutProps {
  startTime: string; // HH:mm
  endTime: string; // HH:mm or "24:00"
  slotHeight: number;
  column?: number;
  totalColumns?: number;
}

export const useScheduleLayout = ({
  startTime,
  endTime,
  slotHeight,
  column = 0,
  totalColumns = 1,
}: UseScheduleLayoutProps) => {
  return useMemo(() => {
    const parseTimeToMinutes = (time: string) => {
      if (time === '24:00') return 24 * 60;
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);

    const top = (startMinutes / 60) * slotHeight;
    const height = ((endMinutes - startMinutes) / 60) * slotHeight;

    // 가로 분할 계산
    const widthPercent = 100 / totalColumns;
    const leftPercent = column * widthPercent;

    return { 
      top, 
      height, 
      left: `${leftPercent}%`, 
      width: `${widthPercent}%` 
    };
  }, [startTime, endTime, slotHeight, column, totalColumns]);
};
