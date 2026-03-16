import { describe, it, expect } from 'vitest';
import { getStartOfWeek, getWeekDays, addDays, formatWeekRange } from './index';

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
