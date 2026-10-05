import { addDaysToDateString, countDaysInclusive, getKstDayStart, toKstDateString } from './kst-date.util';

describe('kst-date.util', () => {
  describe('toKstDateString', () => {
    it('UTC 15:00 이후는 KST로 다음 날이다', () => {
      expect(toKstDateString(new Date('2026-10-04T15:00:00.000Z'))).toBe('2026-10-05');
    });

    it('UTC 14:59:59.999는 KST로 아직 같은 날이다', () => {
      expect(toKstDateString(new Date('2026-10-04T14:59:59.999Z'))).toBe('2026-10-04');
    });
  });

  describe('getKstDayStart', () => {
    it('KST 00:00은 전날 UTC 15:00이다', () => {
      expect(getKstDayStart('2026-10-05').toISOString()).toBe('2026-10-04T15:00:00.000Z');
    });

    it('월초도 전달 마지막 날 UTC 15:00으로 계산한다', () => {
      expect(getKstDayStart('2026-03-01').toISOString()).toBe('2026-02-28T15:00:00.000Z');
    });
  });

  describe('addDaysToDateString', () => {
    it('과거로 빼면 월과 연도를 넘어간다', () => {
      expect(addDaysToDateString('2026-01-01', -1)).toBe('2025-12-31');
    });

    it('윤년 2월 29일을 건너뛰지 않는다', () => {
      expect(addDaysToDateString('2028-02-28', 1)).toBe('2028-02-29');
    });
  });

  describe('countDaysInclusive', () => {
    it('같은 날이면 1일이다', () => {
      expect(countDaysInclusive('2026-10-05', '2026-10-05')).toBe(1);
    });

    it('윤년을 포함한 1년은 양 끝 포함 367일이다', () => {
      expect(countDaysInclusive('2028-01-01', '2029-01-01')).toBe(367);
    });

    it('시작일이 늦으면 0 이하를 반환한다', () => {
      expect(countDaysInclusive('2026-10-06', '2026-10-05')).toBe(0);
    });
  });
});
