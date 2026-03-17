import { useMemo } from 'react';

interface UseScheduleLayoutProps {
  startTime: string; // HH:mm
  endTime: string; // HH:mm or "24:00"
  slotHeight: number;
}

export const useScheduleLayout = ({
  startTime,
  endTime,
  slotHeight,
}: UseScheduleLayoutProps) => {
  return useMemo(() => {
    const parseTimeToMinutes = (time: string) => {
      if (time === '24:00') return 24 * 60;
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);

    // 00:00(0분)부터 시작하는 상대적인 위치
    // 캘린더 그리드 상단(01:00)부터의 오프셋 고려가 필요할 수 있음
    // WeeklyTimeGrid는 01:00부터 24:00까지 보여줌 (총 24시간 분량)
    // 01:00 이전 데이터가 있다면 화면 밖으로 나갈 수 있으므로 주의

    const top = (startMinutes / 60) * slotHeight;
    const height = ((endMinutes - startMinutes) / 60) * slotHeight;

    return { top, height };
  }, [startTime, endTime, slotHeight]);
};
