import { describe, expect, it } from 'vitest';
import type { SchedulePollOption, SchedulePollVoter } from '../model/types';
import {
  buildPollGrid,
  chunkDateKeys,
  collectPollVoters,
  formatDateRanges,
  maxVoteCount,
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
    expect(grid.timeLabels).toEqual(['14:30', '15:00']);
    expect(
      grid.cells.get(pollCellKey('2026-09-22', '14:30'))?.schedulePollOptionId,
    ).toBe('a');
    // 없는 조합은 셀이 비어 있다
    expect(grid.cells.has(pollCellKey('2026-09-23', '14:30'))).toBe(false);
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

describe('maxVoteCount / collectPollVoters', () => {
  it('최다 득표 수와 중복 제거된 참여자 목록을 만든다', () => {
    const options = [
      option('a', [2026, 9, 22], [14, 30], [voter('m1'), voter('m2')]),
      option('b', [2026, 9, 22], [15, 0], [voter('m1')]),
    ];

    expect(maxVoteCount(options)).toBe(2);
    expect(collectPollVoters(options).map((v) => v.bandMemberId)).toEqual([
      'm1',
      'm2',
    ]);
  });

  it('전부 0표면 최다 득표는 0이다', () => {
    expect(maxVoteCount([option('a', [2026, 9, 22], [14, 30])])).toBe(0);
  });
});
