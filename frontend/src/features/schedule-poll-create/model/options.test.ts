import { describe, expect, it } from 'vitest';
import { buildPollOptions, countSlotsPerDay } from './options';

describe('countSlotsPerDay', () => {
  it('시작~종료 범위를 30분 칸 수로 계산한다', () => {
    expect(countSlotsPerDay('14:30', '17:30')).toBe(6);
    expect(countSlotsPerDay('14:00', '14:30')).toBe(1);
  });

  it('종료가 시작보다 빠르거나 같으면 0이다', () => {
    expect(countSlotsPerDay('14:00', '14:00')).toBe(0);
    expect(countSlotsPerDay('15:00', '14:00')).toBe(0);
  });

  it('30분에 못 미치는 자투리는 버린다', () => {
    expect(countSlotsPerDay('14:00', '14:45')).toBe(1);
  });
});

describe('buildPollOptions', () => {
  it('날짜 × 30분 칸을 후보 목록으로 펼친다', () => {
    const options = buildPollOptions(
      ['2026-09-22', '2026-09-23'],
      '14:30',
      '15:30',
    );

    expect(options).toHaveLength(4);

    const first = options[0];
    const firstStart = new Date(first.startAt);
    const firstEnd = new Date(first.endAt);
    expect(firstStart.getHours()).toBe(14);
    expect(firstStart.getMinutes()).toBe(30);
    expect(firstEnd.getTime() - firstStart.getTime()).toBe(30 * 60 * 1000);
  });

  it('시간 범위가 잘못되면 빈 목록을 돌려준다', () => {
    expect(buildPollOptions(['2026-09-22'], '15:00', '14:00')).toEqual([]);
  });
});
