import { describe, expect, it } from 'vitest';

import {
  formatBytes,
  formatDateTime,
  formatKstDate,
  formatPercent,
  getKstDateDaysAgo,
  isoToKstInput,
  kstInputToIso,
} from './format';

describe('formatDateTime', () => {
  it('UTC ISO 문자열을 KST YYYY-MM-DD HH:mm으로 표시한다', () => {
    expect(formatDateTime('2026-10-04T15:30:00.000Z')).toBe('2026-10-05 00:30');
  });

  it('값이 없거나 잘못되면 -를 표시한다', () => {
    expect(formatDateTime(null)).toBe('-');
    expect(formatDateTime('not-a-date')).toBe('-');
  });
});

describe('KST 날짜 계산', () => {
  it('KST 자정을 넘긴 시각은 다음 날짜로 본다', () => {
    expect(formatKstDate('2026-10-04T15:00:00.000Z')).toBe('2026-10-05');
  });

  it('N일 전 KST 날짜를 구한다', () => {
    const now = new Date('2026-10-05T03:00:00.000Z');
    expect(getKstDateDaysAgo(29, now)).toBe('2026-09-06');
  });
});

describe('datetime-local 변환', () => {
  it('입력값을 KST로 해석해 ISO로 바꾼다', () => {
    expect(kstInputToIso('2026-10-05T09:00')).toBe('2026-10-05T00:00:00.000Z');
  });

  it('빈 입력값은 null이다', () => {
    expect(kstInputToIso('')).toBeNull();
  });

  it('ISO를 KST 입력값으로 되돌린다', () => {
    expect(isoToKstInput('2026-10-05T00:00:00.000Z')).toBe('2026-10-05T09:00');
    expect(isoToKstInput(null)).toBe('');
  });
});

describe('formatBytes', () => {
  it('1024 단위로 표시한다', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 ** 3)).toBe('5.0 GB');
  });
});

describe('formatPercent', () => {
  it('기준이 0이면 -를 표시한다', () => {
    expect(formatPercent(3, 0)).toBe('-');
    expect(formatPercent(1, 3)).toBe('33.3%');
  });
});
