import LogoMark from '@/assets/logo/logo.svg?react';
import { cn } from '@/shared/lib/utils';

interface LogoProps {
  /** 로고가 제목 역할을 하는 자리(앱 헤더 등)의 접근성 이름. */
  label?: string;
  /** 옆에 같은 뜻의 글자가 이미 있는 자리. 접근성 트리에서 숨긴다. */
  decorative?: boolean;
  className?: string;
}

/**
 * BandCo 워드마크(흰 글자). 원본 비율은 106×32.
 * 라이트 모드가 생기면 svg의 `fill="white"`를 `currentColor`로 바꾸고
 * 여기서 text 색만 지정하면 되므로, 색만 다른 사본은 두지 않는다.
 */
export const Logo = ({
  label = 'BandCo',
  decorative = false,
  className,
}: LogoProps) => (
  <LogoMark
    {...(decorative
      ? { 'aria-hidden': true, focusable: false }
      : { role: 'img', 'aria-label': label })}
    className={cn('h-8 w-[106px] shrink-0', className)}
  />
);
