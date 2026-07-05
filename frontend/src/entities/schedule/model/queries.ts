import { useQuery } from '@tanstack/react-query';
import { addDays, endOfDay, startOfDay } from '@/shared/lib/date';
import { getSchedules } from '../api';
import { clipToDayWindow, type DayScheduleBlock } from '../lib/day-window';
import { calculateOverlaps } from '../lib/calculate-overlaps';
import { type ScheduleType } from './types';

// 타임라인이 6시에 시작하므로 "하루"는 당일 06:00 ~ 다음 날 06:00이다.
// (widgets/space-calendar의 START_HOUR과 일치시켜야 한다.)
const DAY_ORIGIN_HOUR = 6;

export interface DayScheduleFilter {
  date: Date;
  scheduleType?: ScheduleType;
  onlyMine?: boolean;
  /** 상세 필터(곡·장소). 서버 파라미터가 없어 클라이언트에서 거른다. 빈 배열=제약 없음. */
  songIds?: string[];
  placeIds?: string[];
}

export const scheduleQueries = {
  all: ['schedules'] as const,
  day: (
    spaceId: string,
    range: { from: string; to: string },
    scheduleType: ScheduleType | undefined,
  ) =>
    [
      ...scheduleQueries.all,
      'day',
      spaceId,
      { ...range, scheduleType: scheduleType ?? null },
    ] as const,
};

/**
 * 특정 하루(당일 06:00 ~ 다음 날 06:00)의 일정을 조회한다.
 * 백엔드는 일정을 통째로(startAt/endAt) 주므로, 윈도를 덮는 범위(전날~다음 날)를 받아
 * 각 일정을 윈도 경계에 맞게 잘라(clip) 표시한다. 06시 경계를 넘나드는 일정도 정확히 처리된다.
 * "내가 포함된 일정만 보기"(onlyMine)는 응답의 isMine으로 프론트에서 필터한다(재요청 없음).
 */
export const useDaySchedules = (spaceId: string, filter: DayScheduleFilter) => {
  const {
    date,
    scheduleType,
    onlyMine = false,
    songIds = [],
    placeIds = [],
  } = filter;

  const windowStart = startOfDay(date);
  windowStart.setHours(DAY_ORIGIN_HOUR, 0, 0, 0);
  const windowEnd = addDays(windowStart, 1);

  // 윈도(06:00~다음 날 06:00)를 모두 덮도록 넉넉히 받아 온다.
  const from = startOfDay(addDays(date, -1)).toISOString();
  const to = endOfDay(addDays(date, 1)).toISOString();

  return useQuery({
    queryKey: scheduleQueries.day(spaceId, { from, to }, scheduleType),
    queryFn: () => getSchedules(spaceId, { from, to, scheduleType }),
    select: (data): DayScheduleBlock[] => {
      const blocks = data.items
        .map((item) => clipToDayWindow(item, windowStart, windowEnd))
        .filter((block): block is DayScheduleBlock => block !== null)
        .filter((block) => !onlyMine || block.schedule.isMine)
        .filter(
          (block) =>
            songIds.length === 0 ||
            block.schedule.songs.some((song) => songIds.includes(song.songId)),
        )
        .filter(
          (block) =>
            placeIds.length === 0 ||
            (block.schedule.place !== null &&
              placeIds.includes(block.schedule.place.placeId)),
        );

      return calculateOverlaps(blocks);
    },
    enabled: !!spaceId,
  });
};
