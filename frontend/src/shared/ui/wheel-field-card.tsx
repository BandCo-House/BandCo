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
// 카드 테두리 선. AppDialogContent와 같은 이유로 실제 border가 아니라 inset ring이다.
const RIM_COLOR = 'var(--color-surface-1)';

export const WheelFieldCard = ({
  children,
  className,
  style,
  ...props
}: WheelFieldCardProps) => (
  <div
    {...props}
    className={cn(
      'relative flex flex-col gap-6 overflow-hidden rounded-md bg-white/24 px-5 py-8 backdrop-blur-md',
      className,
    )}
    style={{
      // field-border(실제 border)를 쓰면 border box와 padding box가 어긋난다.
      // GlassRim·GlowBlob은 inset-0이라 padding box까지만 깔려, 그 사이 0.5~1px
      // 링에 글로우가 닿지 않는다. 글로우가 밝은 우하단에서 그 링이 도드라져
      // 둥근 모서리가 각지게 잘린 것처럼 보였다. 같은 두께를 inset ring으로 옮겨
      // 두 박스를 일치시킨다.
      boxShadow: [
        '0px 3px 6px 2px rgba(255, 255, 255, 0.16)',
        `inset 0 0.5px 0 0 ${RIM_COLOR}`,
        `inset -0.5px 0 0 0 ${RIM_COLOR}`,
        `inset 0 -1px 0 0 ${RIM_COLOR}`,
        `inset 0.5px 0 0 0 ${RIM_COLOR}`,
      ].join(', '),
      ...style,
    }}
  >
    <GlassRim />
    <GlowBlob />
    {children}
  </div>
);
