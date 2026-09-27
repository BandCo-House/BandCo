import { describe, expect, it } from 'vitest';
import type { SchedulePollOption, SchedulePollVoter } from '../model/types';
import {
  buildPollGrid,
  dateKeysFromStartAts,
  chunkDateKeys,
  collectPollVoters,
  formatDateRanges,
  rankVoteCounts,
  voteCellAlpha,
  pollCellKey,
} from './poll-grid';

const voter = (id: string): SchedulePollVoter => ({
  bandMemberId: id,
  userId: `user-${id}`,
  nickname: id,
  avatarUrl: null,
});

/** 로컬 시각 기준 후보를 만든다(테스트가 타임존에 흔들리지 않게 Date 생성자 사용). */
const option = (
  id: string,
  date: [number, number, number],
  time: [number, number],
  voters: SchedulePollVoter[] = [],
): SchedulePollOption => {
  const start = new Date(date[0], date[1] - 1, date[2], time[0], time[1]);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return {
    schedulePollOptionId: id,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    voters,
    voteCount: voters.length,
    isRecommended: false,
  };
};

describe('buildPollGrid', () => {
  it('후보를 날짜(열)·시작 시각(행) 그리드로 정렬해 변환한다', () => {
    const grid = buildPollGrid([
      option('b', [2026, 9, 23], [15, 0]),
      option('a', [2026, 9, 22], [14, 30]),
      option('c', [2026, 9, 22], [15, 0]),
    ]);

    expect(grid.dateKeys).toEqual(['2026-09-22', '2026-09-23']);
    expect(grid.timeKeys).toEqual(['14:30~15:00', '15:00~15:30']);
    expect(
      grid.cells.get(pollCellKey('2026-09-22', '14:30~15:00'))
        ?.schedulePollOptionId,
    ).toBe('a');
    // 없는 조합은 셀이 비어 있다
    expect(grid.cells.has(pollCellKey('2026-09-23', '14:30~15:00'))).toBe(
      false,
    );
  });

  it('시작이 같고 길이만 다른 후보는 서로 다른 행으로 남는다', () => {
    const short = option('short', [2026, 9, 22], [14, 0]);
    const long = {
      ...option('long', [2026, 9, 22], [14, 0]),
      endAt: new Date(2026, 8, 22, 15, 0).toISOString(),
    };

    const grid = buildPollGrid([short, long]);

    expect(grid.timeKeys).toEqual(['14:00~14:30', '14:00~15:00']);
    expect(
      grid.cells.get(pollCellKey('2026-09-22', '14:00~14:30'))
        ?.schedulePollOptionId,
    ).toBe('short');
    expect(
      grid.cells.get(pollCellKey('2026-09-22', '14:00~15:00'))
        ?.schedulePollOptionId,
    ).toBe('long');
  });
});

describe('dateKeysFromStartAts', () => {
  it('시작 시각 목록을 중복 없는 로컬 날짜 키 오름차순으로 만든다', () => {
    const day1Morning = new Date(2026, 8, 23, 9, 0).toISOString();
    const day1Evening = new Date(2026, 8, 23, 20, 0).toISOString();
    const day2 = new Date(2026, 8, 22, 14, 30).toISOString();

    expect(dateKeysFromStartAts([day1Morning, day1Evening, day2])).toEqual([
      '2026-09-22',
      '2026-09-23',
    ]);
  });
});

describe('chunkDateKeys', () => {
  it('날짜 열을 3개씩 페이지로 나눈다', () => {
    expect(chunkDateKeys(['a', 'b', 'c', 'd', 'e'])).toEqual([
      ['a', 'b', 'c'],
      ['d', 'e'],
    ]);
  });

  it('빈 목록이면 페이지가 없다', () => {
    expect(chunkDateKeys([])).toEqual([]);
  });
});

describe('formatDateRanges', () => {
  it('연속한 날짜는 구간으로, 떨어진 날짜는 단일 항목으로 묶는다', () => {
    expect(
      formatDateRanges([
        '2026-09-14',
        '2026-09-22',
        '2026-09-23',
        '2026-09-24',
      ]),
    ).toEqual(['9/14(월)', '9/22(화) - 9/24(목)']);
  });

  it('월 경계를 넘는 연속 날짜도 한 구간으로 본다', () => {
    expect(formatDateRanges(['2026-09-30', '2026-10-01'])).toEqual([
      '9/30(수) - 10/1(목)',
    ]);
  });
});

describe('rankVoteCounts / voteCellAlpha', () => {
  it('상위 3개 득표 수만 단계가 갈리고 나머지는 한 단계로 묶인다', () => {
    const options = [
      { ...option('a', [2026, 9, 22], [14, 0]), voteCount: 9 },
      { ...option('b', [2026, 9, 22], [14, 30]), voteCount: 7 },
      { ...option('c', [2026, 9, 22], [15, 0]), voteCount: 5 },
      { ...option('d', [2026, 9, 22], [15, 30]), voteCount: 3 },
      { ...option('e', [2026, 9, 22], [16, 0]), voteCount: 1 },
      { ...option('f', [2026, 9, 22], [16, 30]), voteCount: 0 },
    ];

    const ranks = rankVoteCounts(options);

    expect(voteCellAlpha(9, ranks)).toBe(1);
    expect(voteCellAlpha(7, ranks)).toBe(0.7);
    expect(voteCellAlpha(5, ranks)).toBe(0.4);
    // 4위 이하는 득표 수가 달라도 같은 농도다
    expect(voteCellAlpha(3, ranks)).toBe(voteCellAlpha(1, ranks));
  });

  it('0표는 칠하지 않는다', () => {
    const ranks = rankVoteCounts([
      { ...option('a', [2026, 9, 22], [14, 0]), voteCount: 2 },
    ]);

    expect(voteCellAlpha(0, ranks)).toBeNull();
  });

  it('같은 득표 수는 같은 순위·같은 농도를 받는다', () => {
    const ranks = rankVoteCounts([
      { ...option('a', [2026, 9, 22], [14, 0]), voteCount: 4 },
      { ...option('b', [2026, 9, 22], [14, 30]), voteCount: 4 },
      { ...option('c', [2026, 9, 22], [15, 0]), voteCount: 2 },
    ]);

    expect(voteCellAlpha(4, ranks)).toBe(1);
    expect(voteCellAlpha(2, ranks)).toBe(0.7);
  });
});

describe('collectPollVoters', () => {
  it('중복 제거된 참여자 목록을 만든다', () => {
    const options = [
      option('a', [2026, 9, 22], [14, 30], [voter('m1'), voter('m2')]),
      option('b', [2026, 9, 22], [15, 0], [voter('m1')]),
    ];

    expect(collectPollVoters(options).map((v) => v.bandMemberId)).toEqual([
      'm1',
      'm2',
    ]);
  });
});
