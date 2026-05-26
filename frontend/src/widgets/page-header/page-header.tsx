import type { ReactNode } from 'react';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';

export type PageHeaderProps = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: ReactNode;
};

/**
 * 라우트 레벨에서 공통으로 사용하는 표준 페이지 헤더
 */
export const PageHeader = ({
  title,
  showBack = false,
  onBack,
  rightContent,
}: PageHeaderProps) => {
  return (
    <header
      className="fixed top-0 z-50 w-full max-w-[648px] shrink-0 backdrop-blur-sm"
      style={{
        background:
          'linear-gradient(135deg, var(--gradient-top) 0%, var(--gradient-bottom) 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="mx-auto grid min-h-16 w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6">
        <div className="flex min-w-0 items-center gap-3">
          {showBack ? (
            <button
              type="button"
              aria-label="뒤로 가기"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-overlay-24 focus-visible:outline-2 focus-visible:outline-key"
              onClick={onBack}
            >
              <ArrowRightIcon
                aria-hidden="true"
                data-slot="svg-icon"
                className="size-6 rotate-180"
              />
            </button>
          ) : null}

          <h1 className="min-w-0 truncate typo-xl-sb text-foreground sm:typo-2xl-b">
            {title}
          </h1>
        </div>

        {rightContent ? (
          <div className="flex min-w-0 items-center justify-end gap-2">
            {rightContent}
          </div>
        ) : null}
      </div>
    </header>
  );
};
