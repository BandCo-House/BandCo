import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/shared/lib/utils';

interface ComingSoonProps extends ComponentPropsWithoutRef<'div'> {
  /** 안내 문구. 기본값은 일반 페이지 준비 중 메시지. */
  message?: string;
}

/**
 * 아직 구현되지 않은 빈 화면에 공통으로 노출하는 "준비 중" 플레이스홀더.
 */
export const ComingSoon = ({
  message = '페이지를 준비 중입니다.',
  className,
  ...rest
}: ComingSoonProps) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center py-20 text-center',
      className,
    )}
    {...rest}
  >
    <p className="typo-base-r text-grey-300">{message}</p>
  </div>
);
