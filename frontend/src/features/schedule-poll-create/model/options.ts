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

/**
 * 하루치 후보의 시작 시각 라벨('HH:mm')을 만든다.
 * "이 범위가 30분 후보로 쪼개진다"를 말 대신 실제 값으로 보여주는 미리보기에 쓴다.
 */
export const buildSlotLabels = (
  startTime: string,
  endTime: string,
): string[] => {
  const startMinutes = timeToMinutes(startTime);

  return Array.from(
    { length: countSlotsPerDay(startTime, endTime) },
    (_, i) => {
      const minutes = startMinutes + i * POLL_SLOT_MINUTES;
      const hour = Math.floor(minutes / 60) % 24;
      return `${String(hour).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    },
  );
};

/** 하루의 30분 단위 시각('HH:mm'). 자정(24:00)은 끝 시각 전용으로 뒤에 붙는다. */
const HALF_HOURS = Array.from({ length: 48 }, (_, i) => {
  const minutes = i * POLL_SLOT_MINUTES;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

/** 시작 시각 선택지(00:00 ~ 23:30). */
export const START_TIME_OPTIONS = HALF_HOURS;

/**
 * 끝 시각 선택지. 시작보다 뒤인 시각만 남겨 "끝이 시작보다 빠름"을 고를 수 없게 한다.
 * 마지막 24:00은 자정까지를 뜻한다(날짜 넘김 없이 그 날의 끝).
 */
export const endTimeOptions = (startTime: string): string[] =>
  [...HALF_HOURS, '24:00'].filter(
    (time) => timeToMinutes(time) > timeToMinutes(startTime),
  );

/** 시작을 옮길 때 기존 길이를 유지한 끝 시각. 24:00을 넘지 않는다. */
export const shiftEndTime = (
  prevStart: string,
  prevEnd: string,
  nextStart: string,
): string => {
  const duration = timeToMinutes(prevEnd) - timeToMinutes(prevStart);
  const nextEnd = Math.min(timeToMinutes(nextStart) + duration, 24 * 60);
  return `${String(Math.floor(nextEnd / 60)).padStart(2, '0')}:${String(nextEnd % 60).padStart(2, '0')}`;
};
