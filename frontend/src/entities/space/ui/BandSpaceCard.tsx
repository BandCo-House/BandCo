import { Link } from '@tanstack/react-router';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { cn } from '@/shared/lib/utils';
import { getDdayBadge } from '../lib/dday';
import type { Space } from '../model/types';

// 배지 스타일은 톤별로 따로 선언한다 (상시/여유 vs 임박).
const NEUTRAL_BADGE_CLASS = 'bg-grey-100 text-primary-dark';
const URGENT_BADGE_CLASS = 'bg-destructive-surface text-destructive';

interface BandSpaceCardProps {
  bandId: string;
  space: Space;
  /** D-day 계산 기준일 (선택한 날짜). 미지정 시 오늘. */
  baseDate?: Date;
}

/**
 * 밴드 메인의 공연(스페이스) 한 행. D-day 배지 + 제목/설명 + 이동 화살표.
 * 행 전체가 클릭 가능하며 hover/focus/active 시 배경이 살짝 밝아진다.
 */
export const BandSpaceCard = ({
  bandId,
  space,
  baseDate,
}: BandSpaceCardProps) => {
  const badge = getDdayBadge(space, baseDate);
  const badgeClass =
    badge.tone === 'urgent' ? URGENT_BADGE_CLASS : NEUTRAL_BADGE_CLASS;

  return (
    <Link
      to="/band/$bandId/space/$spaceId"
      params={{ bandId, spaceId: space.spaceId }}
      className="flex items-center gap-2 border-b border-grey-500 px-8 py-5 transition-colors outline-none hover:bg-overlay-24 focus-visible:bg-overlay-24 active:bg-overlay-24"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1">
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 typo-xs-sb',
              badgeClass,
            )}
          >
            {badge.label}
          </span>
          <span className="truncate typo-lg-sb text-grey-50">{space.name}</span>
        </div>
        <p className="truncate typo-sm-r text-grey-200">{space.description}</p>
      </div>
      <ArrowRightIcon
        aria-hidden="true"
        className="size-6 shrink-0 text-grey-300"
      />
    </Link>
  );
};
