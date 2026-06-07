import type { Space } from '../model/types';

export type DdayTone = 'neutral' | 'urgent';

export interface DdayBadge {
  label: string;
  tone: DdayTone;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// 종료일까지 남은 일수가 이 값 이하면 임박(urgent)으로 강조한다.
const URGENT_DDAY_THRESHOLD = 30;

const diffInDays = (target: Date, base: Date): number => {
  const t = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const b = Date.UTC(base.getFullYear(), base.getMonth(), base.getDate());
  return Math.round((t - b) / MS_PER_DAY);
};

/**
 * 스페이스의 D-day 배지를 계산한다.
 * 공연(PERFORMANCE)이 아니거나 종료일이 없으면 '상시'로 표기한다.
 */
export const getDdayBadge = (
  space: Space,
  today: Date = new Date(),
): DdayBadge => {
  if (space.spaceType !== 'PERFORMANCE' || !space.endDate) {
    return { label: '상시', tone: 'neutral' };
  }

  // 종료된 공연은 목록에 노출되지 않지만, 음수가 들어오면 D+N으로 표기한다(D--2 방지).
  const remaining = diffInDays(new Date(space.endDate), today);

  const label =
    remaining === 0
      ? 'D-DAY'
      : remaining > 0
        ? `D-${remaining}`
        : `D+${-remaining}`;

  return {
    label,
    tone: remaining <= URGENT_DDAY_THRESHOLD ? 'urgent' : 'neutral',
  };
};
