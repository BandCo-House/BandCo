import type { ReactNode } from 'react';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { cn } from '@/shared/lib/utils';

export type PageHeaderProps = {
  title: string | (() => ReactNode);
  titleSize?: 'md' | 'lg';
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: ReactNode;
  heightVariant?: 'xs' | 'sm' | 'md' | 'lg';
  renderRight?: () => ReactNode;
  renderBottom?: () => ReactNode;
  bottomBlur?: boolean;
};

const HEIGHT_CLASSES = {
  xs: 'min-h-9',
  sm: 'min-h-14',
  md: 'min-h-[60px]',
  lg: 'min-h-16',
};

/**
 * 라우트 레벨에서 공통으로 사용하는 표준 페이지 헤더 (높이 및 타이틀 커스텀 확장)
 */
export const PageHeader = ({
  title,
  titleSize = 'lg',
  showBack = false,
  onBack,
  rightContent,
  heightVariant = 'lg',
  renderRight,
  renderBottom,
  bottomBlur = false,
}: PageHeaderProps) => {
  const renderTitleArea = () => {
    if (!title) return null;

    // Case 1: 타이틀이 함수(컴포넌트 렌더러)인 경우 -> 기본 h1 스타일 무시하고 통째로 렌더링
    if (typeof title === 'function') {
      return <div className="min-w-0 flex-1">{title()}</div>;
    }

    // Case 2: 타이틀이 일반 텍스트(string)인 경우
    const titleClass = cn(
      'min-w-0 truncate text-grey-50',
      titleSize === 'md' ? 'typo-lg-sb' : 'typo-xl-sb',
    );

    return <h1 className={titleClass}>{title}</h1>;
  };

  return (
    <header
      className="fixed top-0 z-50 w-full max-w-[648px] shrink-0 bg-gradient-top/65 backdrop-blur-sm"
      style={
        bottomBlur
          ? { boxShadow: '0px 8px 40px 0px rgba(221, 254, 85, 0.12)' }
          : undefined
      }
    >
      <div
        className={cn(
          'mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 transition-all duration-200',
          HEIGHT_CLASSES[heightVariant],
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {showBack ? (
            <button
              type="button"
              aria-label="뒤로 가기"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-foreground focus-visible:outline-2 focus-visible:outline-key"
              onClick={onBack}
            >
              <ArrowRightIcon
                aria-hidden="true"
                data-slot="svg-icon"
                className="size-6 rotate-180"
              />
            </button>
          ) : null}

          {renderTitleArea()}
        </div>

        {renderRight || rightContent ? (
          <div className="flex min-w-0 items-center justify-end gap-2">
            {renderRight ? renderRight() : rightContent}
          </div>
        ) : null}
      </div>

      {renderBottom ? <div className="w-full">{renderBottom()}</div> : null}
    </header>
  );
};
