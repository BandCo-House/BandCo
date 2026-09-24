import type { CreateSchedulePollOptionInput } from '@/entities/schedule-poll/model/types';

/** 후보 한 칸의 길이(분). 투표 그리드 행 단위와 같다. */
export const POLL_SLOT_MINUTES = 30;

const MS_PER_MINUTE = 60 * 1000;

const timeToMinutes = (time: string): number => {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return hour * 60 + minute;
};

/** 선택한 시간 범위에서 하루에 만들어질 후보(30분 칸) 수. 범위가 잘못되면 0. */
export const countSlotsPerDay = (
  startTime: string,
  endTime: string,
): number => {
  const span = timeToMinutes(endTime) - timeToMinutes(startTime);
  return span > 0 ? Math.floor(span / POLL_SLOT_MINUTES) : 0;
};

/**
 * 선택한 날짜들 × 시작~종료 범위를 30분 후보 목록으로 펼친다.
 * dateKey는 'YYYY-MM-DD'(로컬), 시간은 'HH:mm'.
 */
export const buildPollOptions = (
  dateKeys: string[],
  startTime: string,
  endTime: string,
): CreateSchedulePollOptionInput[] => {
  const slotsPerDay = countSlotsPerDay(startTime, endTime);
  const startMinutes = timeToMinutes(startTime);

  return dateKeys.flatMap((dateKey) => {
    const [year = 0, month = 1, day = 1] = dateKey.split('-').map(Number);
    const dayStart = new Date(year, month - 1, day).getTime();

    return Array.from({ length: slotsPerDay }, (_, index) => {
      const slotStart =
        dayStart + (startMinutes + index * POLL_SLOT_MINUTES) * MS_PER_MINUTE;
      return {
        startAt: new Date(slotStart).toISOString(),
        endAt: new Date(
          slotStart + POLL_SLOT_MINUTES * MS_PER_MINUTE,
        ).toISOString(),
      };
    });
  });
};
