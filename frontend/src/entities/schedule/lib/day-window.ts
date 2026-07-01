import { type ScheduleItem } from '../model/types';

/**
 * 하루 윈도(예: 당일 06:00 ~ 다음 날 06:00)에 맞춰 잘라낸 일정 블록.
 * startMin/endMin은 윈도 시작 기준 분(0 = 윈도 시작)이고, 라벨은 원래 시각을 보여준다.
 */
export interface DayScheduleBlock {
  schedule: ScheduleItem;
  startMin: number;
  endMin: number;
  startLabel: string; // 원래 시작 "HH:mm"
  endLabel: string; // 원래 종료 "HH:mm"
  column?: number; // 겹침 컬럼(0부터)
  totalColumns?: number; // 겹침 총 컬럼 수
}

const formatTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/**
 * 일정을 [windowStart, windowEnd] 구간으로 잘라 윈도 상대 위치(분)를 가진 블록으로 만든다.
 * 윈도와 겹치지 않으면 null. 구간을 벗어나는 부분은 윈도 경계로 클램프한다.
 * (자정 기준 분리와 달리 6시 경계도 정확히 처리한다.)
 */
export const clipToDayWindow = (
  schedule: ScheduleItem,
  windowStart: Date,
  windowEnd: Date,
): DayScheduleBlock | null => {
  const start = new Date(schedule.startAt);
  const end = new Date(schedule.endAt);
  if (!(end > windowStart && start < windowEnd)) return null;

  const visibleStart = start < windowStart ? windowStart : start;
  const visibleEnd = end > windowEnd ? windowEnd : end;
  const toMin = (date: Date) =>
    Math.round((date.getTime() - windowStart.getTime()) / 60000);

  return {
    schedule,
    startMin: toMin(visibleStart),
    endMin: toMin(visibleEnd),
    startLabel: formatTime(start),
    endLabel: formatTime(end),
  };
};
