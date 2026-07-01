import { cn } from '@/shared/lib/utils';

interface SpaceSummaryHeaderProps {
  name: string;
  description?: string;
  memberCount?: number;
  songCount?: number;
  className?: string;
}

const CountChip = ({ children }: { children: string }) => (
  <span className="inline-flex items-center rounded-full bg-grey-100 px-2 py-0.5 typo-xs-sb text-grey-500">
    {children}
  </span>
);

/**
 * 합주 공간 상세 상단 요약: 공간 이름/설명과 멤버 수·곡 수 칩.
 */
export const SpaceSummaryHeader = ({
  name,
  description,
  memberCount,
  songCount,
  className,
}: SpaceSummaryHeaderProps) => {
  return (
    <header className={cn('flex flex-col gap-2', className)}>
      <h1 className="typo-xl-sb text-grey-50">{name}</h1>
      {description && (
        <p className="typo-base-r text-grey-300">{description}</p>
      )}
      {(typeof memberCount === 'number' || typeof songCount === 'number') && (
        <div className="flex items-center gap-2">
          {typeof memberCount === 'number' && (
            <CountChip>{`${memberCount}명`}</CountChip>
          )}
          {typeof songCount === 'number' && (
            <CountChip>{`${songCount}곡`}</CountChip>
          )}
        </div>
      )}
    </header>
  );
};
