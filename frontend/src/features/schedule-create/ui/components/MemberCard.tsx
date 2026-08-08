import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface MemberCardProps {
  name: string;
  /** 악기/지참사항 등 부가 메모(예: Fender Stratocaster). 없으면 생략. */
  note?: string | null;
  /** 세션(플레이 파트) 칩 목록(예: 보컬, 기타). */
  sessions?: string[];
  /** 이름 옆 역할 뱃지(예: 리더/부리더). */
  badge?: string;
  /** 'glass'(선택/상세) | 'solid'(합주 세션 카드). 기본 glass. */
  tone?: 'glass' | 'solid';
  /** 지정 시 버튼으로 렌더링(선택 토글). 미지정 시 정적 카드. */
  onClick?: () => void;
  selected?: boolean;
  /** 지정 시 우측 상단 X(제거) 버튼을 렌더한다. onClick과 함께 쓰지 않는다. */
  onRemove?: () => void;
  className?: string;
}

/** 멤버/참여자 정보 카드. 이름(+뱃지) · 악기 · 세션 칩을 보여준다. */
export const MemberCard = ({
  name,
  note,
  sessions = [],
  badge,
  tone = 'glass',
  onClick,
  selected,
  onRemove,
  className,
}: MemberCardProps) => {
  const toneClass =
    tone === 'solid' ? 'bg-surface-3' : 'border border-surface-3 bg-white/24';

  const content = (
    <>
      <div className="flex items-center gap-1">
        <p className="typo-sm-b text-grey-50">{name}</p>
        {badge && (
          <span className="flex h-5 items-center rounded-full bg-surface-1 px-2 text-xs leading-[1.4] font-medium text-grey-500">
            {badge}
          </span>
        )}
      </div>
      {note ? (
        <p className="overflow-hidden text-xs leading-[1.3] font-normal text-ellipsis whitespace-nowrap text-grey-50">
          {note}
        </p>
      ) : null}
      {sessions.length > 0 && (
        <div className="flex items-center gap-2 text-xs leading-[1.3] font-bold text-grey-200">
          {sessions.map((session, index) => (
            <span key={`${session}-${index}`}>{session}</span>
          ))}
        </div>
      )}
    </>
  );

  const base = cn(
    'relative flex flex-col items-start justify-center gap-2 rounded-[20px] px-4 py-3 text-left',
    toneClass,
    className,
  );

  if (!onClick) {
    return (
      <div className={base}>
        {content}
        {onRemove && (
          <button
            type="button"
            aria-label={`${name} 제거`}
            onClick={onRemove}
            className="absolute -top-1 -right-1.5 flex size-5 items-center justify-center rounded-full border border-grey-50 bg-grey-400 text-grey-50 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X aria-hidden="true" className="size-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        base,
        'transition-colors focus-visible:outline-2 focus-visible:outline-primary',
      )}
    >
      {content}
    </button>
  );
};
