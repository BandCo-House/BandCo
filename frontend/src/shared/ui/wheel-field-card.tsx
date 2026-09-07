import type { ComponentPropsWithoutRef } from 'react';
import { GlassRim } from '@/shared/ui/glass-rim';
import { GlowBlob } from '@/shared/ui/glow-blob';
import { cn } from '@/shared/lib/utils';

type WheelFieldCardProps = ComponentPropsWithoutRef<'div'>;

/**
 * 휠 피커(날짜·시간)를 담는 유리 카드.
 *
 * 휠 컴포넌트는 휠만 그리고 테두리·블러·림·글로우는 사용처가 각자 인라인으로
 * 만들고 있었다. 그래서 유리 표현을 손볼 때 한쪽만 반영되고 다른 쪽이 빠졌다
 * (일정 시간 휠에는 GlassRim이 들어갔는데 합주 공간 날짜 휠에는 안 들어갔다).
 * 표면을 여기 한 곳으로 모은다.
 */
export const WheelFieldCard = ({
  children,
  className,
  ...props
}: WheelFieldCardProps) => (
  <div
    {...props}
    className={cn(
      'relative flex flex-col gap-6 overflow-hidden rounded-md field-border border-surface-1 bg-white/24 px-5 py-8 shadow-[0px_3px_6px_2px_rgba(255,255,255,0.16)] backdrop-blur-md',
      className,
    )}
  >
    <GlassRim />
    <GlowBlob />
    {children}
  </div>
);
