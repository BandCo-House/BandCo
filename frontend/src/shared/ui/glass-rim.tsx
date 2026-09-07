import { cn } from '@/shared/lib/utils';

/**
 * 유리 가장자리 하이라이트 림. 1px 테두리 링에만 위→아래로 밝아지는 흰색
 * 그라디언트를 씌워 빛이 유리 모서리에 반사되는 느낌을 준다(screensizes 방식).
 * mask 두 겹 + exclude 합성으로 안쪽을 파내 테두리만 남긴다 — Safari 포함 지원.
 *
 * 부모는 position이 잡혀 있어야 하고(relative/fixed 등), border-radius를 상속한다.
 * 장식 요소라 접근성 트리에서 숨기고 pointer-event를 받지 않는다.
 */
export function GlassRim({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 z-20 rounded-[inherit]',
        className,
      )}
      style={{
        padding: '1px',
        background:
          'linear-gradient(to bottom, rgba(255,255,255,0.85), rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(255,255,255,0.55))',
        WebkitMask:
          'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        WebkitMaskComposite: 'xor',
        mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        maskComposite: 'exclude',
      }}
    />
  );
}
