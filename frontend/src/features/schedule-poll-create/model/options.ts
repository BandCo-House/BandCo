import type { CreateSchedulePollOptionInput } from '@/entities/schedule-poll/model/types';

/** 후보 한 칸의 길이(분). 투표 그리드 행 단위와 같다. */
export const POLL_SLOT_MINUTES = 30;

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

    return Array.from({ length: slotsPerDay }, (_, index) => {
      // epoch 덧셈은 DST 전환일에 벽시계가 1시간 밀린다. Date 생성자에 분을 넘겨
      // 로컬 벽시계 기준으로 정규화한다(자정부터 n분 = 사용자가 고른 시각).
      const offsetMinutes = startMinutes + index * POLL_SLOT_MINUTES;
      return {
        startAt: new Date(year, month - 1, day, 0, offsetMinutes).toISOString(),
        endAt: new Date(
          year,
          month - 1,
          day,
          0,
          offsetMinutes + POLL_SLOT_MINUTES,
        ).toISOString(),
      };
    });
  });
};
