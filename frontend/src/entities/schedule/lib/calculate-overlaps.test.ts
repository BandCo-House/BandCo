import { describe, it, expect } from 'vitest';
import { calculateOverlaps } from './calculate-overlaps';
import { type DayScheduleBlock } from './day-window';
import { type ScheduleItem } from '../model/types';

const makeSchedule = (id: string): ScheduleItem => ({
  scheduleId: id,
  spaceId: 'space-1',
  scheduleType: 'PRACTICE',
  title: id,
  startAt: '2026-03-17T00:00:00',
  endAt: '2026-03-17T00:00:00',
  place: null,
  songs: [],
  participantCount: 0,
  isMine: false,
  memo: null,
  status: 'PLANNED',
});

const makeBlock = (
  id: string,
  startMin: number,
  endMin: number,
): DayScheduleBlock => ({
  schedule: makeSchedule(id),
  startMin,
  endMin,
  startLabel: '00:00',
  endLabel: '00:00',
});

describe('calculateOverlaps', () => {
  it('겹치지 않는 일정은 모두 컬럼 0, totalColumns 1이다', () => {
    const result = calculateOverlaps([
      makeBlock('a', 540, 600), // 09:00~10:00
      makeBlock('b', 660, 720), // 11:00~12:00
    ]);

    expect(result.map((b) => b.column)).toEqual([0, 0]);
    expect(result.map((b) => b.totalColumns)).toEqual([1, 1]);
  });

  it('겹치는 일정은 추가된 순서대로 다음 컬럼으로 민다', () => {
    const result = calculateOverlaps([
      makeBlock('first', 540, 660), // 09:00~11:00
      makeBlock('second', 540, 660), // 09:00~11:00
      makeBlock('third', 600, 720), // 10:00~12:00
    ]);

    expect(result.find((b) => b.schedule.scheduleId === 'first')?.column).toBe(
      0,
    );
    expect(result.find((b) => b.schedule.scheduleId === 'second')?.column).toBe(
      1,
    );
    expect(result.find((b) => b.schedule.scheduleId === 'third')?.column).toBe(
      2,
    );
    expect(result.every((b) => b.totalColumns === 3)).toBe(true);
  });

  it('앞 일정이 끝나면 컬럼을 재사용한다', () => {
    const result = calculateOverlaps([
      makeBlock('a', 540, 600), // 09:00~10:00
      makeBlock('b', 600, 660), // 10:00~11:00
    ]);

    expect(result.map((b) => b.column)).toEqual([0, 0]);
  });

  it('0분(시작=종료) 블록도 totalColumns가 최소 1이다', () => {
    const result = calculateOverlaps([
      makeBlock('zero', 600, 600), // 자기 자신과도 겹치지 않는 0분 블록
    ]);

    expect(result[0]?.column).toBe(0);
    expect(result[0]?.totalColumns).toBe(1);
  });
});
