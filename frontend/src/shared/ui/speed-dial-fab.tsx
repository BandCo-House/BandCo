import { useEffect, useRef, useState } from 'react';
import { SVGIcon } from '@/shared/ui/icon';
import { cn } from '@/shared/lib/utils';

export interface SpeedDialAction {
  label: string;
  onClick?: () => void;
}

interface SpeedDialFabProps {
  actions: SpeedDialAction[];
  mainLabel?: string;
  /** 바깥 컨테이너 위치/여백 override (예: bottom 위치 조정) */
  className?: string;
}

const CONTAINER_BASE =
  'pointer-events-none fixed inset-x-0 bottom-[140px] z-40 mx-auto w-full max-w-[648px] px-6';

/**
 * 공통 스피드다이얼 FAB. + 버튼으로 액션 목록을 펼치고, 버튼에 가까운(아래)
 * 항목부터 순차적으로 나타난다. 액션은 객체 배열로 주입한다.
 */
export const SpeedDialFab = ({
  actions,
  mainLabel = '메뉴 열기',
  className,
}: SpeedDialFabProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={cn(CONTAINER_BASE, className)}>
      <div
        ref={containerRef}
        className="pointer-events-auto ml-auto flex w-fit flex-col items-end gap-3"
      >
        <div
          className={cn(
            'flex flex-col items-end gap-3',
            !isOpen && 'pointer-events-none',
          )}
        >
          {actions.map((action, index) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                setIsOpen(false);
                action.onClick?.();
              }}
              // 버튼에 가까운(아래) 항목부터 순차적으로 나타나도록 지연을 준다.
              style={{
                transitionDelay: isOpen
                  ? `${(actions.length - 1 - index) * 60}ms`
                  : '0ms',
              }}
              className={cn(
                'rounded-full bg-primary px-4 py-2.5 typo-sm-sb text-gradient-top shadow-drop transition-[opacity,transform] duration-200',
                isOpen
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-2 opacity-0',
              )}
            >
              {action.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label={isOpen ? '메뉴 닫기' : mainLabel}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className={cn(
            'flex size-14 items-center justify-center rounded-full bg-primary shadow-drop transition-transform duration-200',
            isOpen && 'rotate-45',
          )}
        >
          <SVGIcon icon="Add" size="md" className="text-gradient-top" />
        </button>
      </div>
    </div>
  );
};
