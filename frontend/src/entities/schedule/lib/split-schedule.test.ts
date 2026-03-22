import { describe, it, expect } from 'vitest';
import { splitSchedule } from './split-schedule';
import { type ScheduleItem } from '../model/types';

describe('splitSchedule', () => {
  const baseSchedule: ScheduleItem = {
    scheduleId: '1',
    spaceId: 'space-1',
    scheduleType: 'PRACTICE',
    title: '테스트 일정',
    startAt: '2026-03-17T10:00:00',
    endAt: '2026-03-17T12:00:00',
    place: null,
    practice: null,
    meeting: null,
    ui: {
      cardTitle: '테스트',
      cardSubTitle: '서브',
      colorToken: 'gray-500',
    },
    status: 'SCHEDULED',
  };

  it('당일 일정이면 하나의 조각을 반환한다', () => {
    const results = splitSchedule(baseSchedule);
    expect(results).toHaveLength(1);
    expect(results[0].date).toBe('2026-03-17');
    expect(results[0].startTime).toBe('10:00');
    expect(results[0].endTime).toBe('12:00');
  });

  it('자정을 넘기는 일정이면 두 개의 조각으로 나눈다', () => {
    const crossDaySchedule = {
      ...baseSchedule,
      startAt: '2026-03-17T22:00:00',
      endAt: '2026-03-18T02:00:00',
    };
    const results = splitSchedule(crossDaySchedule);
    expect(results).toHaveLength(2);

    // 첫 번째 날 (17일 22:00 ~ 24:00)
    expect(results[0].date).toBe('2026-03-17');
    expect(results[0].startTime).toBe('22:00');
    expect(results[0].endTime).toBe('24:00');

    // 두 번째 날 (18일 00:00 ~ 02:00)
    expect(results[1].date).toBe('2026-03-18');
    expect(results[1].startTime).toBe('00:00');
    expect(results[1].endTime).toBe('02:00');
  });

  it('여러 날에 걸친 일정이면 날짜별로 조각을 나눈다', () => {
    const multiDaySchedule = {
      ...baseSchedule,
      startAt: '2026-03-17T10:00:00',
      endAt: '2026-03-19T15:00:00',
    };
    const results = splitSchedule(multiDaySchedule);
    expect(results).toHaveLength(3);

    expect(results[0].date).toBe('2026-03-17');
    expect(results[0].startTime).toBe('10:00');
    expect(results[0].endTime).toBe('24:00');

    expect(results[1].date).toBe('2026-03-18');
    expect(results[1].startTime).toBe('00:00');
    expect(results[1].endTime).toBe('24:00');

    expect(results[2].date).toBe('2026-03-19');
    expect(results[2].startTime).toBe('00:00');
    expect(results[2].endTime).toBe('15:00');
  });

  it('정확히 자정에 끝나는 일정이면 전날 24:00으로 끝나는 하나의 조각을 반환한다', () => {
    const midnightEndSchedule = {
      ...baseSchedule,
      startAt: '2026-03-17T22:00:00',
      endAt: '2026-03-18T00:00:00',
    };
    const results = splitSchedule(midnightEndSchedule);
    expect(results).toHaveLength(1);
    expect(results[0].date).toBe('2026-03-17');
    expect(results[0].startTime).toBe('22:00');
    expect(results[0].endTime).toBe('24:00');
  });
});
