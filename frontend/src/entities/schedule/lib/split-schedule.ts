import { type ScheduleItem } from '../model/types';

export interface SchedulePart {
  schedule: ScheduleItem;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  partIndex: number;
  totalParts: number;
  column?: number; // 겹치는 일정들 사이에서의 컬럼 위치 (0부터 시작)
  totalColumns?: number; // 겹치는 일정들 사이에서의 총 컬럼 수
}

/**
 * 일정을 자정 기준으로 분리하여 배열로 반환합니다.
 */
export const splitSchedule = (schedule: ScheduleItem): SchedulePart[] => {
  const parts: Omit<SchedulePart, 'totalParts'>[] = [];
  const start = new Date(schedule.startAt);
  const end = new Date(schedule.endAt);

  // 날짜만 추출 (YYYY-MM-DD)
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 시간만 추출 (HH:mm)
  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  let current = new Date(start);
  let index = 0;

  while (current < end) {
    const currentDateStr = formatDate(current);
    const nextDay = new Date(current);
    nextDay.setDate(current.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);

    parts.push({
      schedule,
      date: currentDateStr,
      startTime: formatTime(current),
      endTime: nextDay <= end ? '24:00' : formatTime(end),
      partIndex: index++,
    });

    current = nextDay;
  }

  return parts.map((part) => ({
    ...part,
    totalParts: parts.length,
  }));
};
