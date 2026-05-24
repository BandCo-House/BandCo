import { useState, useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/utils';
import { SVGIcon } from '@/shared/ui/icon';

type BandListFABProps = {
  onCreateClick: () => void;
  onInviteClick: () => void;
};

export const BandListFAB = ({
  onCreateClick,
  onInviteClick,
}: BandListFABProps) => {
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

  const handleCreate = () => {
    setIsOpen(false);
    onCreateClick();
  };

  const handleInvite = () => {
    setIsOpen(false);
    onInviteClick();
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[140px] z-40 mx-auto w-full max-w-[648px] px-6">
      <div
        ref={containerRef}
        className="pointer-events-auto flex flex-col items-end gap-3"
      >
        {/* 메뉴 옵션 */}
        <div
          className={cn(
            'flex flex-col items-end gap-2 transition-all duration-200',
            isOpen
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-2 opacity-0',
          )}
        >
          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-full bg-secondary-temporary px-4 py-2.5 typo-sm-m text-secondary-foreground shadow-drop transition hover:brightness-110"
          >
            새 밴드
          </button>
          <button
            type="button"
            onClick={handleInvite}
            className="flex items-center gap-2 rounded-full bg-secondary-temporary px-4 py-2.5 typo-sm-m text-secondary-foreground shadow-drop transition hover:brightness-110"
          >
            초대코드 입력
          </button>
        </div>

        {/* FAB 메인 버튼 */}
        <button
          type="button"
          aria-label="밴드 메뉴 열기"
          onClick={() => setIsOpen((o) => !o)}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-drop transition-transform duration-200',
            isOpen && 'rotate-45',
          )}
        >
          <SVGIcon icon="Add" size="md" className="text-primary-temporary" />
        </button>
      </div>
    </div>
  );
};
