import { cn } from '@/shared/lib/utils';

interface MemberCardProps {
  name: string;
  /** 악기/지참사항 등 부가 메모(예: Fender Stratocaster). 없으면 생략. */
  note?: string | null;
  /** 세션(플레이 파트) 칩 목록(예: 보컬, 기타). */
  sessions?: string[];
  /** 'glass'(선택/상세) | 'solid'(합주 세션 카드). 기본 glass. */
  tone?: 'glass' | 'solid';
  /** 지정 시 버튼으로 렌더링(선택 토글). 미지정 시 정적 카드. */
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

/** 멤버/참여자 정보 카드. 이름 · 악기 · 세션 칩을 보여준다. */
export const MemberCard = ({
  name,
  note,
  sessions = [],
  tone = 'glass',
  onClick,
  selected,
  className,
}: MemberCardProps) => {
  const toneClass =
    tone === 'solid' ? 'bg-surface-3' : 'border border-surface-3 bg-white/24';

  const content = (
    <>
      <p className="typo-sm-b text-grey-50">{name}</p>
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
    'flex flex-col items-start justify-center gap-2 rounded-[20px] px-4 py-3 text-left',
    toneClass,
    className,
  );

  if (!onClick) {
    return <div className={base}>{content}</div>;
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
