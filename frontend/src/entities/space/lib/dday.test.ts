import { describe, expect, it } from 'vitest';
import { getDdayBadge } from './dday';
import type { Space } from '../model/types';

const base: Space = {
  spaceId: 's',
  bandId: 'b',
  name: 'n',
  description: '',
  spaceType: 'PERFORMANCE',
  status: 'ACTIVE',
  startDate: '2026-01-01',
  endDate: '2026-06-09',
};

const today = new Date('2026-06-07T00:00:00');

describe('getDdayBadge', () => {
  it('공연이 아닌 공간은 상시로 표기한다', () => {
    expect(getDdayBadge({ ...base, spaceType: 'PRACTICE' }, today)).toEqual({
      label: '상시',
      tone: 'neutral',
    });
  });

  it('임박한 공연은 D-N과 urgent 톤으로 표기한다', () => {
    expect(getDdayBadge({ ...base, endDate: '2026-06-09' }, today)).toEqual({
      label: 'D-2',
      tone: 'urgent',
    });
  });

  it('여유 있는 공연은 neutral 톤으로 표기한다', () => {
    expect(getDdayBadge({ ...base, endDate: '2026-09-05' }, today)).toEqual({
      label: 'D-90',
      tone: 'neutral',
    });
  });

  it('음수(지난 날짜)는 D+N으로 표기한다 (D--2 방지)', () => {
    expect(getDdayBadge({ ...base, endDate: '2026-06-05' }, today).label).toBe(
      'D+2',
    );
  });
});
