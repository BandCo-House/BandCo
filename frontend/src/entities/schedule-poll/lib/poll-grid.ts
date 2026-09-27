import {
  WEEKDAY_LABELS,
  formatClockTime,
  formatLocalDate,
} from '@/shared/lib/date';
import type { SchedulePollOption } from '../model/types';

/** 상세 그리드에서 한 페이지에 보여줄 날짜(열) 수. */
export const POLL_GRID_DATES_PER_PAGE = 3;

/** 'YYYY-MM-DD' 로컬 날짜 키. */
export type PollDateKey = string;

/** 행 키 'HH:mm~HH:mm'(시작~종료). 시작이 같고 길이만 다른 후보가 겹쳐 지워지지 않게 종료까지 포함한다. */
export type PollTimeKey = string;

export interface PollGrid {
  /** 후보가 있는 날짜(열) 목록. 오름차순. */
  dateKeys: PollDateKey[];
  /** 후보 시간(행) 키 목록. 시작 시각 오름차순. */
  timeKeys: PollTimeKey[];
  /** `${dateKey} ${timeKey}` → 후보. 없는 조합은 비어 있는 셀로 그린다. */
  cells: Map<string, SchedulePollOption>;
}

export const pollCellKey = (
  dateKey: PollDateKey,
  timeKey: PollTimeKey,
): string => `${dateKey} ${timeKey}`;

/** 행 키에서 표시용 시작 시각 'HH:mm'을 꺼낸다. */
export const pollTimeKeyLabel = (timeKey: PollTimeKey): string =>
  timeKey.split('~')[0] ?? timeKey;

/** 후보 목록을 날짜(열)×시간(행) 그리드로 변환한다. */
export const buildPollGrid = (options: SchedulePollOption[]): PollGrid => {
  const dateKeys = new Set<string>();
  const timeKeys = new Set<string>();
  const cells = new Map<string, SchedulePollOption>();

  for (const option of options) {
    const date = new Date(option.startAt);
    const dateKey = formatLocalDate(date);
    const timeKey = `${formatClockTime(option.startAt)}~${formatClockTime(option.endAt)}`;
    dateKeys.add(dateKey);
    timeKeys.add(timeKey);
    cells.set(pollCellKey(dateKey, timeKey), option);
  }

  return {
    dateKeys: [...dateKeys].sort(),
    timeKeys: [...timeKeys].sort(),
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

/** 후보 시작 시각(ISO) 목록 → 로컬 날짜 키 목록(중복 제거·오름차순). 목록 카드의 날짜 구간용. */
export const dateKeysFromStartAts = (startAts: string[]): PollDateKey[] =>
  [...new Set(startAts.map((iso) => formatLocalDate(new Date(iso))))].sort();

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
    // DST가 있는 타임존은 자정 간격이 23~25시간이라 정확히 24시간 비교 대신 일수로 반올림한다.
    const dayDiff = Math.round(
      (current.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000),
    );
    const isConsecutive = dayDiff === 1;
    if (!isConsecutive) {
      pushRange(start, prev);
      start = current;
    }
    prev = current;
  }
  pushRange(start, prev);

  return ranges;
};

/**
 * 상위 3개 득표 수의 셀 농도. 나머지 득표는 REST_ALPHA 한 단계로 묶는다.
 *
 * 득표/최다득표 비율을 그대로 알파로 쓰면 멤버가 많을수록 소수 득표가 투명에
 * 가까워져 0표와 구분되지 않는다(20명 중 1표 = 0.05). 읽어야 하는 정보는
 * "가장 많이 겹치는 때"라 상위 세 단계만 구분하고, 나머지는 "표가 있긴 하다"로
 * 평평하게 둔다.
 */
const TOP_RANK_ALPHAS = [1, 0.7, 0.4];
const REST_ALPHA = 0.15;

/** 알파가 이 값 이상이면 배경이 밝아 글자를 어둡게 쓴다. */
export const DARK_TEXT_ALPHA_THRESHOLD = 0.5;

/** 득표 수 → 순위(0-based, 0표 제외). 같은 득표 수는 같은 순위·같은 색이다. */
export const rankVoteCounts = (
  options: SchedulePollOption[],
): Map<number, number> => {
  const distinct = [
    ...new Set(options.map((option) => option.voteCount).filter((c) => c > 0)),
  ].sort((a, b) => b - a);

  return new Map(distinct.map((count, rank) => [count, rank]));
};

/** 셀 배경 알파. 0표면 null(칠하지 않는다). */
export const voteCellAlpha = (
  voteCount: number,
  ranks: Map<number, number>,
): number | null => {
  if (voteCount <= 0) return null;
  const rank = ranks.get(voteCount);
  return rank === undefined
    ? REST_ALPHA
    : (TOP_RANK_ALPHAS[rank] ?? REST_ALPHA);
};

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
