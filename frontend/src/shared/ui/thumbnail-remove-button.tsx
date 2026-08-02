import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface ThumbnailRemoveButtonProps {
  /** 무엇을 지우는지 알리는 접근성 이름. 아이콘 전용 버튼이라 필수. */
  label: string;
  onClick: () => void;
  className?: string;
}

/**
 * 썸네일 우상단에 겹치는 제거(X) 배지.
 * 배지 자체는 20px이지만 버튼에 패딩을 둬 32px 터치 타깃을 확보하고,
 * 늘어난 만큼 -margin으로 되돌려 배지 위치는 그대로 유지한다.
 */
export const ThumbnailRemoveButton = ({
  label,
  onClick,
  className,
}: ThumbnailRemoveButtonProps) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className={cn(
      'absolute -top-2.5 -right-2.5 flex items-center justify-center p-1.5',
      'rounded-full focus-visible:outline-2 focus-visible:outline-primary',
      className,
    )}
  >
    <span className="flex size-5 items-center justify-center rounded-full border border-grey-50 bg-grey-400 text-grey-50">
      <X aria-hidden="true" className="size-3" />
    </span>
  </button>
);
