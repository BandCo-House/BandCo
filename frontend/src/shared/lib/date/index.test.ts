import { describe, it, expect } from 'vitest';
import {
  getStartOfWeek,
  getWeekDays,
  getMonthDays,
  getWeekOfMonth,
  addDays,
  addMonths,
  formatWeekRange,
  formatDotDate,
  formatClockTime,
} from './index';

describe('Date Utilities (날짜 유틸리티)', () => {
  describe('getStartOfWeek', () => {
    it('주 중간의 날짜(수요일)가 주어졌을 때 해당 주의 월요일을 반환해야 합니다', () => {
      // 2026-03-04는 수요일입니다
      const date = new Date(2026, 2, 4);
      const startOfWeek = getStartOfWeek(date);

      expect(startOfWeek.getFullYear()).toBe(2026);
      expect(startOfWeek.getMonth()).toBe(2);
      expect(startOfWeek.getDate()).toBe(2); // 월요일은 2026-03-02
      expect(startOfWeek.getDay()).toBe(1); // 1 = 월요일
    });

    it('일요일이 주어졌을 때 해당 주의 월요일을 반환해야 합니다 (이전 주가 아님)', () => {
      // 2026-03-08은 일요일입니다
      const date = new Date(2026, 2, 8);
      const startOfWeek = getStartOfWeek(date);

      expect(startOfWeek.getFullYear()).toBe(2026);
      expect(startOfWeek.getMonth()).toBe(2);
      expect(startOfWeek.getDate()).toBe(2); // 월요일은 2026-03-02
    });

    it('월이 넘어가는 경우를 역방향으로 올바르게 처리해야 합니다 (예: 3월 1일 일요일 -> 2026년 2월 23일 월요일)', () => {
      // 2026-03-01은 일요일입니다
      const date = new Date(2026, 2, 1);
      const startOfWeek = getStartOfWeek(date);

      expect(startOfWeek.getFullYear()).toBe(2026);
      expect(startOfWeek.getMonth()).toBe(1); // 2월의 인덱스는 1
      expect(startOfWeek.getDate()).toBe(23); // 월요일은 2026-02-23
    });

    it('윤년 2월의 월 넘김 경우를 역방향으로 올바르게 처리해야 합니다', () => {
      // 2024년은 윤년이며 2024-03-01은 금요일입니다
      const date = new Date(2024, 2, 1);
      const startOfWeek = getStartOfWeek(date);

      expect(startOfWeek.getFullYear()).toBe(2024);
      expect(startOfWeek.getMonth()).toBe(1); // 2월의 인덱스는 1
      expect(startOfWeek.getDate()).toBe(26); // 월요일은 2024-02-26
    });
  });

  describe('getWeekDays', () => {
    it('주어진 시작일로부터 7일간의 날짜(월~일) 배열을 반환해야 합니다', () => {
      // 2026-03-02는 월요일입니다
      const startDate = new Date(2026, 2, 2);
      const weekDays = getWeekDays(startDate);

      expect(weekDays).toHaveLength(7);
      expect(weekDays[0].getDate()).toBe(2); // 월요일
      expect(weekDays[0].getDay()).toBe(1);

      expect(weekDays[6].getDate()).toBe(8); // 일요일
      expect(weekDays[6].getDay()).toBe(0);
    });

    it('배열 생성 중 월이 넘어가는 경우를 정방향으로 올바르게 처리해야 합니다', () => {
      // 2026-02-23은 월요일이고, 2026년 2월은 28일까지 있습니다
      const startDate = new Date(2026, 1, 23);
      const weekDays = getWeekDays(startDate);

      expect(weekDays).toHaveLength(7);
      expect(weekDays[0].getDate()).toBe(23);
      expect(weekDays[0].getMonth()).toBe(1); // 2월

      expect(weekDays[5].getDate()).toBe(28); // 토요일
      expect(weekDays[5].getMonth()).toBe(1); // 2월

      expect(weekDays[6].getDate()).toBe(1); // 일요일 (다음 달 첫 날)
      expect(weekDays[6].getMonth()).toBe(2); // 3월
    });
  });

  describe('addDays', () => {
    it('주어진 날짜에 양수 일(day)을 더해야 합니다', () => {
      const date = new Date(2026, 2, 4); // 3월 4일
      const result = addDays(date, 7);

      expect(result.getDate()).toBe(11); // 3월 11일
    });

    it('주어진 날짜에 음수 일(day)을 더해(즉 빼서) 날짜를 계산해야 합니다', () => {
      const date = new Date(2026, 2, 4); // 3월 4일
      const result = addDays(date, -7);

      expect(result.getDate()).toBe(25); // 2월 25일
      expect(result.getMonth()).toBe(1); // 2월 인덱스는 1
    });
  });

  describe('formatWeekRange', () => {
    it('같은 연도, 같은 월일 경우 "YYYY년 M월 D일 ~ D일" 포맷으로 반환해야 합니다', () => {
      const startDate = new Date(2026, 2, 2); // 3월 2일
      const endDate = new Date(2026, 2, 8); // 3월 8일
      expect(formatWeekRange(startDate, endDate)).toBe('2026년 3월 2일 ~ 8일');
    });

    it('같은 연도, 다른 월일 경우 "YYYY년 M월 D일 ~ M월 D일" 포맷으로 반환해야 합니다', () => {
      const startDate = new Date(2026, 1, 23); // 2월 23일
      const endDate = new Date(2026, 2, 1); // 3월 1일
      expect(formatWeekRange(startDate, endDate)).toBe(
        '2026년 2월 23일 ~ 3월 1일',
      );
    });

    it('다른 연도일 경우 "YYYY년 M월 D일 ~ YYYY년 M월 D일" 포맷으로 반환해야 합니다', () => {
      const startDate = new Date(2025, 11, 29); // 12월 29일
      const endDate = new Date(2026, 0, 4); // 1월 4일
      expect(formatWeekRange(startDate, endDate)).toBe(
        '2025년 12월 29일 ~ 2026년 1월 4일',
      );
    });
  });
});

describe('formatDotDate', () => {
  it('ISO 문자열을 "YYYY.MM. DD"로 변환한다', () => {
    expect(formatDotDate('2026-03-01T14:30:00')).toBe('2026.03. 01');
  });
  it('값이 없으면 "-"를 반환한다', () => {
    expect(formatDotDate(null)).toBe('-');
  });
});

describe('formatClockTime', () => {
  it('ISO 문자열을 "HH:mm"으로 변환한다', () => {
    expect(formatClockTime('2026-03-01T09:05:00')).toBe('09:05');
  });
  it('값이 없으면 빈 문자열을 반환한다', () => {
    expect(formatClockTime(null)).toBe('');
  });

  describe('getMonthDays', () => {
    it('1일 앞을 그 요일만큼 빈 칸으로 채우고 말일까지 반환해야 합니다', () => {
      // 2026-10-01은 목요일입니다(일요일 시작이면 앞에 빈 칸 4개).
      const days = getMonthDays(2026, 9);

      expect(days.slice(0, 4)).toEqual([null, null, null, null]);
      expect(days[4]?.getDate()).toBe(1);
      expect(days.at(-1)?.getDate()).toBe(31);
      expect(days).toHaveLength(35);
    });
  });

  describe('addMonths', () => {
    it('같은 일이 있는 달로는 날짜를 유지한 채 옮겨야 합니다', () => {
      const next = addMonths(new Date(2026, 9, 11), 1);

      expect(next.getMonth()).toBe(10);
      expect(next.getDate()).toBe(11);
    });

    it('같은 일이 없는 달로 옮기면 한 달을 건너뛰지 않고 말일로 맞춰야 합니다', () => {
      const next = addMonths(new Date(2026, 0, 31), 1);

      expect(next.getMonth()).toBe(1);
      expect(next.getDate()).toBe(28);
    });

    it('해를 넘겨 이전 달로 옮길 수 있어야 합니다', () => {
      const prev = addMonths(new Date(2026, 0, 15), -1);

      expect(prev.getFullYear()).toBe(2025);
      expect(prev.getMonth()).toBe(11);
    });
  });

  describe('getWeekOfMonth', () => {
    it('일요일 시작 기준으로 그 달의 몇 번째 주인지 반환해야 합니다', () => {
      // 2026-10: 1~3일이 1주차, 4~10일이 2주차, 11~17일이 3주차.
      expect(getWeekOfMonth(new Date(2026, 9, 3))).toBe(1);
      expect(getWeekOfMonth(new Date(2026, 9, 4))).toBe(2);
      expect(getWeekOfMonth(new Date(2026, 9, 11))).toBe(3);
      expect(getWeekOfMonth(new Date(2026, 9, 31))).toBe(5);
    });
  });
});
