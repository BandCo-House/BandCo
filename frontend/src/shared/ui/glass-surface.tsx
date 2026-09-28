import type { ComponentPropsWithoutRef } from 'react';
import { GlassRim } from '@/shared/ui/glass-rim';
import { GlowBlob } from '@/shared/ui/glow-blob';
import { cn } from '@/shared/lib/utils';

// 테두리 선. AppDialogContent와 같은 이유로 실제 border가 아니라 inset ring이다 —
// border를 쓰면 border box와 padding box가 어긋나, inset-0인 GlassRim·GlowBlob이
// 그 사이 0.5~1px 링에 닿지 않아 둥근 모서리가 각지게 잘린 것처럼 보인다.
const RIM_COLOR = 'var(--color-surface-1)';

/** 유리 표면의 그림자 + 테두리 링. */
const GLASS_SHADOW = [
  '0px 3px 6px 2px rgba(255, 255, 255, 0.16)',
  `inset 0 0.5px 0 0 ${RIM_COLOR}`,
  `inset -0.5px 0 0 0 ${RIM_COLOR}`,
  `inset 0 -1px 0 0 ${RIM_COLOR}`,
  `inset 0.5px 0 0 0 ${RIM_COLOR}`,
].join(', ');

type GlassSurfaceProps = ComponentPropsWithoutRef<'div'>;

/**
 * 앱 공통 유리 표면(블러 + 림 하이라이트 + 글로우).
 * 휠 카드·툴팁처럼 "떠 있는 면"이 같은 재질을 공유하도록 한 곳에 모은다.
 * radius·padding은 사용처가 className으로 정한다.
 */
export const GlassSurface = ({
  children,
  className,
  style,
  ...props
}: GlassSurfaceProps) => (
  <div
    {...props}
    className={cn(
      'relative overflow-hidden bg-white/24 backdrop-blur-md',
      className,
    )}
    style={{ boxShadow: GLASS_SHADOW, ...style }}
  >
    <GlassRim />
    <GlowBlob />
    <div className="relative z-10">{children}</div>
  </div>
);
