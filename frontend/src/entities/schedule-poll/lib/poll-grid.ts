import { formatClockTime, formatLocalDate } from '@/shared/lib/date';
import type { SchedulePollOption } from '../model/types';

export const WEEKDAY_LABELS = [
  '일',
  '월',
  '화',
  '수',
  '목',
  '금',
  '토',
] as const;

/** 상세 그리드에서 한 페이지에 보여줄 날짜(열) 수. */
export const POLL_GRID_DATES_PER_PAGE = 3;

/** 'YYYY-MM-DD' 로컬 날짜 키. */
export type PollDateKey = string;

export interface PollGrid {
  /** 후보가 있는 날짜(열) 목록. 오름차순. */
  dateKeys: PollDateKey[];
  /** 후보 시작 시각 'HH:mm'(행) 목록. 오름차순. */
  timeLabels: string[];
  /** `${dateKey} ${timeLabel}` → 후보. 없는 조합은 비어 있는 셀로 그린다. */
  cells: Map<string, SchedulePollOption>;
}

export const pollCellKey = (dateKey: PollDateKey, timeLabel: string): string =>
  `${dateKey} ${timeLabel}`;

/** 후보 목록을 날짜(열)×시작 시각(행) 그리드로 변환한다. */
export const buildPollGrid = (options: SchedulePollOption[]): PollGrid => {
  const dateKeys = new Set<string>();
  const timeLabels = new Set<string>();
  const cells = new Map<string, SchedulePollOption>();

  for (const option of options) {
    const date = new Date(option.startAt);
    const dateKey = formatLocalDate(date);
    const timeLabel = formatClockTime(option.startAt);
    dateKeys.add(dateKey);
    timeLabels.add(timeLabel);
    cells.set(pollCellKey(dateKey, timeLabel), option);
  }

  return {
    dateKeys: [...dateKeys].sort(),
    timeLabels: [...timeLabels].sort(),
    cells,
  };
};

/** 날짜 열을 페이지 단위(3열)로 나눈다. */
export const chunkDateKeys = (dateKeys: PollDateKey[]): PollDateKey[][] => {
  const pages: PollDateKey[][] = [];
  for (let i = 0; i < dateKeys.length; i += POLL_GRID_DATES_PER_PAGE) {
    pages.push(dateKeys.slice(i, i + POLL_GRID_DATES_PER_PAGE));
  }
  return pages;
};

const parseDateKey = (dateKey: PollDateKey): Date => {
  const [year = 0, month = 1, day = 1] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** 열 머리글 '9.22 목'. */
export const formatDateColumnLabel = (dateKey: PollDateKey): string => {
  const date = parseDateKey(dateKey);
  return `${date.getMonth() + 1}.${date.getDate()} ${WEEKDAY_LABELS[date.getDay()]}`;
};

const formatRangeEdge = (date: Date): string =>
  `${date.getMonth() + 1}/${date.getDate()}(${WEEKDAY_LABELS[date.getDay()]})`;

/**
 * 날짜 목록을 연속 구간으로 묶어 '9/22(목) - 9/24(토)' 형태로 만든다.
 * 하루짜리 구간은 '9/14(화)' 하나만 남긴다.
 */
export const formatDateRanges = (dateKeys: PollDateKey[]): string[] => {
  if (dateKeys.length === 0) return [];
  const sorted = [...dateKeys].sort().map(parseDateKey);

  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  const pushRange = (from: Date, to: Date) => {
    ranges.push(
      from.getTime() === to.getTime()
        ? formatRangeEdge(from)
        : `${formatRangeEdge(from)} - ${formatRangeEdge(to)}`,
    );
  };

  for (const current of sorted.slice(1)) {
    const isConsecutive =
      current.getTime() - prev.getTime() === 24 * 60 * 60 * 1000;
    if (!isConsecutive) {
      pushRange(start, prev);
      start = current;
    }
    prev = current;
  }
  pushRange(start, prev);

  return ranges;
};

/** 그리드 셀 농도 계산의 분모(최다 득표 수). 전부 0표면 0. */
export const maxVoteCount = (options: SchedulePollOption[]): number =>
  options.reduce((max, option) => Math.max(max, option.voteCount), 0);

/** 투표 참여자 목록(중복 제거, 후보 순서대로). 명단 확인 팝오버에 쓴다. */
export const collectPollVoters = (options: SchedulePollOption[]) => {
  const seen = new Map<string, SchedulePollOption['voters'][number]>();
  for (const option of options) {
    for (const voter of option.voters) {
      if (!seen.has(voter.bandMemberId)) seen.set(voter.bandMemberId, voter);
    }
  }
  return [...seen.values()];
};
