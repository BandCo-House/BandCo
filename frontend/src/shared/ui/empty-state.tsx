import { cn } from '@/shared/lib/utils';

type EmptyStateProps = {
  /** 무엇이 비었는지. "검색 결과가 없습니다." */
  title: string;
  /** 다음에 뭘 하면 되는지. 없으면 제목만 렌더한다. */
  description?: string;
  className?: string;
};

/**
 * 빈 상태·결과 없음 안내.
 *
 * 화면마다 크기(14·12)·굵기(r·sb·b)·색(grey-100·200·300·400·primary)이
 * 제각각이라 같은 역할이 다른 위계로 보이던 것을 한 곳으로 모았다.
 * 안내문구는 14로 고정한다 — 12로 내리면 태그·날짜 같은 메타와 같은 급이 된다.
 */
export const EmptyState = ({
  title,
  description,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      'flex w-full flex-col items-center justify-center gap-1 py-8 text-center',
      className,
    )}
  >
    <p className="typo-sm-sb text-grey-100">{title}</p>
    {description ? (
      <p className="typo-sm-r text-grey-300">{description}</p>
    ) : null}
  </div>
);
