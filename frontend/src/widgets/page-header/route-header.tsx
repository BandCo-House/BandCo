import type { ReactNode } from 'react';
import { Link, useRouter } from '@tanstack/react-router';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { cn } from '@/shared/lib/utils';
import {
  slidingIndicatorClass,
  useSlidingIndicator,
} from '@/shared/lib/use-sliding-indicator';
import { Button, buttonVariants } from '@/shared/ui/button';
import type { HeaderStaticConfig, HeaderTab } from './types';

const HEIGHT_CLASSES = {
  xs: 'min-h-9',
  sm: 'min-h-14',
  md: 'min-h-[60px]',
  lg: 'min-h-16',
};

interface RouteHeaderProps {
  /** resolveHeader가 병합해 돌려준 헤더 설정. */
  header: HeaderStaticConfig;
  /** 활성 라우트 params. 뒤로가기·탭·우측 액션 링크 계산에 쓴다. */
  params: Record<string, string>;
}

/**
 * 라우트 공통 헤더. 예전에 RootLayout에 흩어져 있던 뒤로가기·탭·우측 액션 파생과 PageHeader 렌더를
 * 한 컴포넌트로 흡수했다. 설정 병합(기본값+static+동적 resolve)은 여전히 순수 함수 resolveHeader가 맡고,
 * 이 컴포넌트는 그 결과 + router로 렌더/네비게이션만 담당한다.
 */
export const RouteHeader = ({ header, params }: RouteHeaderProps) => {
  const router = useRouter();

  const resolveTabActive = (tab: HeaderTab) =>
    tab.active ??
    tab.isActive?.({ pathname: router.state.location.pathname, params }) ??
    false;

  const { containerRef: tabContainerRef, indicatorRef: tabIndicatorRef } =
    useSlidingIndicator(header.tabs?.find(resolveTabActive)?.key ?? '');

  const handleBack = () => {
    if (header.backBehavior === 'browser') {
      router.history.back();
      return;
    }
    if (header.backTo) {
      const backParams = header.getBackParams?.(params);
      router.navigate({
        to: header.backTo as never,
        ...(backParams ? { params: backParams as never } : {}),
      });
      return;
    }
    router.history.back();
  };

  const rightContent = ((): ReactNode => {
    const tabs = header.tabs?.map((tab) => {
      const tabTo = tab.getTo?.(params) ?? tab.to;
      const [tabPath, tabSearchString] = tabTo?.split('?') ?? [];
      const tabSearch = tabSearchString
        ? Object.fromEntries(new URLSearchParams(tabSearchString))
        : undefined;
      const tabParams = tab.getParams?.(params);
      const isActive = resolveTabActive(tab);
      const variant = isActive ? 'default' : 'outline';
      const styleClass = cn(
        buttonVariants({ variant: isActive ? 'ghost' : 'outline', size: 'sm' }),
        'relative z-10',
        isActive && 'text-key-foreground',
      );

      // 링크 탭은 <a> 자체를 버튼 스타일로 렌더링한다(예전엔 <a><button> 중첩으로 HTML 규격 위반).
      return tabPath ? (
        <Link
          key={tab.key}
          to={tabPath as never}
          {...(tabParams ? { params: tabParams as never } : {})}
          {...(tabSearch ? { search: tabSearch as never } : {})}
          onClick={tab.onClick}
          data-variant={variant}
          data-active={isActive}
          aria-current={isActive ? 'page' : undefined}
          className={styleClass}
        >
          {tab.label}
        </Link>
      ) : (
        <Button
          key={tab.key}
          type="button"
          variant="ghost"
          size="sm"
          data-variant={variant}
          data-active={isActive}
          aria-current={isActive ? 'page' : undefined}
          className={styleClass}
          onClick={tab.onClick}
        >
          {tab.label}
        </Button>
      );
    });

    const rightActionParams = header.getRightActionParams?.(params);
    const rightAction =
      header.rightActionLabel && header.rightActionTo ? (
        <Link
          to={header.rightActionTo as never}
          {...(rightActionParams ? { params: rightActionParams as never } : {})}
          data-variant="outline"
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          {header.rightActionLabel}
        </Link>
      ) : null;

    if (!tabs?.length && !rightAction) return null;

    return (
      <div className="flex items-center gap-2">
        {tabs?.length ? (
          <div
            ref={tabContainerRef}
            className="relative flex items-center gap-2"
          >
            <span
              ref={tabIndicatorRef}
              aria-hidden="true"
              className={cn(slidingIndicatorClass, 'rounded-full bg-key')}
            />
            {tabs}
          </div>
        ) : null}
        {rightAction}
      </div>
    );
  })();

  const renderTitleArea = () => {
    const { title } = header;
    if (!title) return null;

    // 타이틀이 함수(컴포넌트 렌더러)면 기본 h1 스타일을 무시하고 통째로 렌더링한다.
    if (typeof title === 'function') {
      return <div className="min-w-0 flex-1">{title()}</div>;
    }

    return (
      <h1
        className={cn(
          'min-w-0 truncate text-grey-50',
          header.titleSize === 'md' ? 'typo-lg-sb' : 'typo-xl-sb',
        )}
      >
        {title}
      </h1>
    );
  };

  return (
    <header
      className={cn(
        'fixed top-0 z-50 w-full max-w-[648px] shrink-0 bg-gradient-top/65 backdrop-blur-sm',
        header.bottomBlur && 'header-glow',
      )}
    >
      <div
        className={cn(
          'mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 transition-all duration-200',
          HEIGHT_CLASSES[header.heightVariant ?? 'lg'],
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {header.showBack ? (
            <button
              type="button"
              aria-label="뒤로 가기"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-foreground focus-visible:outline-2 focus-visible:outline-key"
              onClick={handleBack}
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

        {header.renderRight || rightContent ? (
          <div className="flex min-w-0 items-center justify-end gap-2">
            {header.renderRight ? header.renderRight() : rightContent}
          </div>
        ) : null}
      </div>

      {header.renderBottom ? (
        <div className="w-full">{header.renderBottom()}</div>
      ) : null}
    </header>
  );
};
