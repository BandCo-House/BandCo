import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { type DayScheduleBlock } from '@/entities/schedule/lib/day-window';
import { type ScheduleType } from '@/entities/schedule/model/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { cn } from '@/shared/lib/utils';
import { useScheduleLayout } from '../model/use-schedule-layout';

interface DayScheduleCardProps {
  block: DayScheduleBlock;
  slotHeight: number;
  /** 상단 패딩(px). 카드 top 보정에 쓴다. */
  topOffset?: number;
  onClick?: (scheduleId: string) => void;
}

const CARD_THEME: Record<ScheduleType, string> = {
  PRACTICE: 'bg-destructive-surface',
  MEETING: 'bg-success-surface',
};

const TIER_COMPACT_MAX = 30;
const TIER_PARTICIPANTS_MIN = 60;
const TIER_TWO_LINE_TITLE_MIN = 90;

const AVATAR_PX = 20;
const AVATAR_GAP_PX = 4;
const AVATAR_STEP_PX = AVATAR_PX + AVATAR_GAP_PX;
const OVERFLOW_CHIP_PX = AVATAR_PX;

const fitAvatarCount = (
  width: number,
  previewCount: number,
  totalCount: number,
): number => {
  const showableMax = Math.min(previewCount, totalCount);
  if (width <= 0 || showableMax === 0) return showableMax;

  if (
    showableMax === totalCount &&
    showableMax * AVATAR_STEP_PX - AVATAR_GAP_PX <= width
  ) {
    return showableMax;
  }

  // 넘침 칩 자리를 빼고 남는 폭에 완전히 들어가는 수만
  const widthForAvatars = width - OVERFLOW_CHIP_PX - AVATAR_GAP_PX;
  const count = Math.floor((widthForAvatars + AVATAR_GAP_PX) / AVATAR_STEP_PX);
  return Math.max(0, Math.min(count, showableMax));
};

export const DayScheduleCard = ({
  block,
  slotHeight,
  topOffset = 0,
  onClick,
}: DayScheduleCardProps) => {
  const {
    schedule,
    startMin,
    endMin,
    startLabel,
    endLabel,
    column = 0,
    totalColumns = 1,
  } = block;
  const { top, height } = useScheduleLayout({
    startMin,
    endMin,
    slotHeight,
    topOffset,
  });

  const durationMin = endMin - startMin;

  const placeName = schedule.place?.name ?? null;
  const timeText = `${startLabel} - ${endLabel}`;

  const participants = schedule.participants ?? [];

  const avatarRowRef = useRef<HTMLDivElement>(null);
  const [rowWidth, setRowWidth] = useState(0);
  useLayoutEffect(() => {
    const el = avatarRowRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => setRowWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const shownCount = fitAvatarCount(
    rowWidth,
    participants.length,
    schedule.participantCount,
  );
  const visibleAvatars = participants.slice(0, shownCount);
  const overflow = schedule.participantCount - shownCount;

  const isCompact = durationMin <= TIER_COMPACT_MAX;
  const showMeta = durationMin > TIER_COMPACT_MAX;
  const showParticipants =
    durationMin > TIER_PARTICIPANTS_MIN && schedule.participantCount > 0;
  const allowTwoLineTitle = durationMin > TIER_TWO_LINE_TITLE_MIN;

  // 겹침은 보이는 폭의 1/2 고정(cqw) → 3개 이상이면 가로 스크롤
  const horizontalStyle = {
    '--cols': totalColumns,
    '--col': column,
    left: 'calc(var(--col) * var(--track-w) / min(var(--cols), 2))',
    width: 'calc(var(--track-w) / min(var(--cols), 2) - 8px)',
  } as CSSProperties;

  const metaRow = (
    <div
      className="flex min-w-0 shrink flex-wrap items-center overflow-hidden typo-xs-r text-grey-400"
      style={{ columnGap: 20, rowGap: 2 }}
    >
      <span className="shrink-0">{timeText}</span>
      {placeName && <span className="truncate">{placeName}</span>}
    </div>
  );

  return (
    <button
      type="button"
      onClick={() => onClick?.(schedule.scheduleId)}
      style={{ top: `${top}px`, minHeight: `${height}px`, ...horizontalStyle }}
      className={cn(
        'absolute z-[1] flex flex-col gap-1 overflow-hidden rounded-md text-left',
        isCompact ? 'px-3 py-1' : 'p-3',
        CARD_THEME[schedule.scheduleType],
      )}
    >
      {isCompact ? (
        <div className="flex min-w-0 items-center gap-1 overflow-hidden">
          <p className="truncate typo-sm-sb leading-tight text-gradient-top">
            {schedule.title}
          </p>
          <span className="shrink-0 typo-xs-r leading-tight text-grey-400">
            {startLabel}
          </span>
        </div>
      ) : (
        <>
          <p
            className={cn(
              'shrink-0 typo-sm-sb text-gradient-top',
              allowTwoLineTitle ? 'line-clamp-2' : 'truncate',
            )}
          >
            {schedule.title}
          </p>
          {showMeta && metaRow}
          {showParticipants && (
            <div
              ref={avatarRowRef}
              className="mt-auto flex shrink-0 items-center gap-1"
            >
              {visibleAvatars.map((participant) => (
                <Avatar
                  key={participant.bandMemberId}
                  size="sm"
                  className="size-5 shrink-0"
                >
                  {participant.profileImageUrl && (
                    <AvatarImage
                      src={participant.profileImageUrl}
                      alt={participant.nickname}
                    />
                  )}
                  <AvatarFallback className="bg-grey-600 text-grey-50">
                    {participant.nickname.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {overflow > 0 && (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-grey-300 typo-xs-m text-grey-50">
                  {`+${overflow}`}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </button>
  );
};
