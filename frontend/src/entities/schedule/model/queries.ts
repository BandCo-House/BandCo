import { useQuery } from '@tanstack/react-query';
import {
  addDays,
  endOfDay,
  formatLocalDate,
  startOfDay,
} from '@/shared/lib/date';
import { getScheduleDetail, getSchedules } from '../api';
import { clipToDayWindow, type DayScheduleBlock } from '../lib/day-window';
import { calculateOverlaps } from '../lib/calculate-overlaps';
import { type ScheduleItem, type ScheduleType } from './types';

// 타임라인이 6시에 시작하므로 "하루"는 당일 06:00 ~ 다음 날 06:00이다.
// (widgets/space-calendar의 START_HOUR과 일치시켜야 한다.)
const DAY_ORIGIN_HOUR = 6;

// 월 단위 조회에서 한 번에 받는 개수(백엔드 take 상한). 한 공간의 한 달 일정이
// 이보다 많으면 뒤쪽 날짜의 점이 빠진다 — 그 규모가 되면 커서 페이지네이션으로 바꾼다.
const MONTH_SCHEDULE_TAKE = 100;

/** 응답을 클라이언트에서 거르는 조건. 서버 재요청 없이 토글 즉시 반영된다. */
interface ScheduleClientFilter {
  onlyMine?: boolean;
  /** 상세 필터(곡·장소·팀). 다중 선택이라 단일값 서버 파라미터로 못 맞춰 클라이언트에서 거른다. 빈 배열=제약 없음. */
  songIds?: string[];
  placeIds?: string[];
  teamIds?: string[];
}

export interface DayScheduleFilter extends ScheduleClientFilter {
  date: Date;
  scheduleType?: ScheduleType;
}

export interface MonthScheduleFilter extends ScheduleClientFilter {
  /** 조회할 달에 속한 아무 날짜. */
  month: Date;
  scheduleType?: ScheduleType;
}

const matchesClientFilter = (
  schedule: ScheduleItem,
  {
    onlyMine = false,
    songIds = [],
    placeIds = [],
    teamIds = [],
  }: ScheduleClientFilter,
): boolean =>
  (!onlyMine || (schedule.isMine ?? false)) &&
  (songIds.length === 0 ||
    schedule.songs.some((song) => songIds.includes(song.songId))) &&
  (placeIds.length === 0 ||
    (schedule.place !== null && placeIds.includes(schedule.place.placeId))) &&
  (teamIds.length === 0 ||
    (schedule.team !== null && teamIds.includes(schedule.team.teamId)));

/** 그날의 타임라인 윈도(당일 06:00 ~ 다음 날 06:00)에 걸리는 일정 블록. */
const toDayBlocks = (
  items: ScheduleItem[],
  date: Date,
  filter: ScheduleClientFilter,
): DayScheduleBlock[] => {
  const windowStart = startOfDay(date);
  windowStart.setHours(DAY_ORIGIN_HOUR, 0, 0, 0);
  const windowEnd = addDays(windowStart, 1);

  return items
    .filter((item) => matchesClientFilter(item, filter))
    .map((item) => clipToDayWindow(item, windowStart, windowEnd))
    .filter((block): block is DayScheduleBlock => block !== null);
};

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
  month: (
    spaceId: string,
    range: { from: string; to: string },
    scheduleType: ScheduleType | undefined,
  ) =>
    [
      ...scheduleQueries.all,
      'month',
      spaceId,
      { ...range, scheduleType: scheduleType ?? null },
    ] as const,
  detail: (scheduleId: string) =>
    [...scheduleQueries.all, 'detail', scheduleId] as const,
};

/** 일정 상세(GET /schedules/:id)를 조회한다. */
export const useScheduleDetail = (scheduleId: string | null) =>
  useQuery({
    queryKey: scheduleQueries.detail(scheduleId ?? ''),
    queryFn: () => getScheduleDetail(scheduleId as string),
    enabled: !!scheduleId,
  });

/**
 * 특정 하루(당일 06:00 ~ 다음 날 06:00)의 일정을 조회한다.
 * 백엔드는 일정을 통째로(startAt/endAt) 주므로, 윈도를 덮는 범위(전날~다음 날)를 받아
 * 각 일정을 윈도 경계에 맞게 잘라(clip) 표시한다. 06시 경계를 넘나드는 일정도 정확히 처리된다.
 * "내가 포함된 일정만 보기"(onlyMine)는 응답의 isMine으로 프론트에서 필터한다(재요청 없음).
 */
export const useDaySchedules = (spaceId: string, filter: DayScheduleFilter) => {
  const { date, scheduleType, ...clientFilter } = filter;

  // 백엔드 필터가 start_at만 지원하므로, 윈도 시작 이전에 시작해도 윈도로 넘어오는
  // (자정을 넘긴) 일정까지 잡도록 앞뒤 하루씩 넉넉히 받아 clipToDayWindow로 자른다.
  const from = startOfDay(addDays(date, -1)).toISOString();
  const to = endOfDay(addDays(date, 1)).toISOString();

  return useQuery({
    queryKey: scheduleQueries.day(spaceId, { from, to }, scheduleType),
    queryFn: () => getSchedules(spaceId, { from, to, scheduleType }),
    select: (data): DayScheduleBlock[] =>
      calculateOverlaps(toDayBlocks(data.items, date, clientFilter)),
    enabled: !!spaceId,
  });
};

/**
 * 한 달의 날짜별 일정 수를 조회한다(월별 캘린더의 점 표시용).
 * 키는 로컬 날짜('YYYY-MM-DD'), 일정이 없는 날은 맵에 없다.
 * 세는 기준은 일 타임라인과 같다 — 그날을 눌렀을 때 타임라인에 보이는 블록 수다.
 * 그래서 06시 경계를 넘는 일정은 양쪽 날에 모두 잡히고, 필터도 똑같이 적용된다.
 */
export const useMonthScheduleCounts = (
  spaceId: string,
  filter: MonthScheduleFilter,
  options: { enabled?: boolean } = {},
) => {
  const { month, scheduleType, ...clientFilter } = filter;
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  // 일 조회와 같은 이유로 앞뒤 하루씩 넉넉히 받는다.
  const from = startOfDay(addDays(firstDay, -1)).toISOString();
  const to = endOfDay(addDays(lastDay, 1)).toISOString();

  return useQuery({
    queryKey: scheduleQueries.month(spaceId, { from, to }, scheduleType),
    queryFn: () =>
      getSchedules(spaceId, {
        from,
        to,
        scheduleType,
        take: MONTH_SCHEDULE_TAKE,
      }),
    select: (data): Map<string, number> => {
      const counts = new Map<string, number>();
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(month.getFullYear(), month.getMonth(), day);
        const count = toDayBlocks(data.items, date, clientFilter).length;
        if (count > 0) counts.set(formatLocalDate(date), count);
      }
      return counts;
    },
    enabled: !!spaceId && (options.enabled ?? true),
  });
};
