import { Link } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';
import {
  slidingIndicatorClass,
  useSlidingIndicator,
} from '@/shared/lib/use-sliding-indicator';

export type RouteTabItem = {
  key: string;
  label: string;
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
  /** 라벨 오른쪽 위 점. 읽지 않음 같은 "볼 게 있다" 표시에 쓴다. */
  showDot?: boolean;
};

type RouteTabsVariant = 'underline' | 'pill';

type RouteTabsProps = {
  /** nav의 aria-label. 화면마다 다른 탭 묶음임을 보조기기에 알린다. */
  ariaLabel: string;
  tabs: readonly RouteTabItem[];
  activeKey: string;
  variant?: RouteTabsVariant;
  /**
   * 탭 전환을 히스토리에 쌓지 않는다.
   *
   * 탭이 서로 **다른 라우트**면 켜지 않는다 — 다른 페이지로 이동한 것이니
   * 뒤로가기로 되짚어지는 게 맞다(밴드 메인: /band/x · /archive · /library).
   * 탭이 **같은 라우트의 검색 파라미터**면 켠다 — 같은 페이지의 필터를 바꾼
   * 것뿐인데 히스토리가 쌓이면 뒤로가기가 페이지를 벗어나지 못한다
   * (알림: /notifications?tab=...).
   */
  replaceOnChange?: boolean;
};

const VARIANT = {
  underline: {
    nav: 'relative flex w-full',
    indicator: 'top-auto bottom-0 h-0.5 bg-primary',
    item: 'flex flex-1 items-center justify-center border-b-2 border-transparent pt-4 pb-5 typo-sm-sb',
    active: 'text-primary',
    inactive: 'text-grey-300',
    dot: 'absolute top-2 right-4',
  },
  pill: {
    nav: 'relative flex w-full gap-4 px-5 pt-2 pb-4',
    indicator: 'rounded-[20px] bg-primary shadow-sm',
    item: 'relative z-10 flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-[20px] typo-base-b',
    active: 'text-grey-600',
    inactive: 'text-primary',
    dot: 'absolute top-2 right-4',
  },
} satisfies Record<RouteTabsVariant, Record<string, string>>;

/**
 * 헤더 하단(`header.renderBottom`)에 들어가는 라우트 탭.
 * 인디케이터 위치는 useSlidingIndicator가 DOM에 직접 반영한다.
 */
export const RouteTabs = ({
  ariaLabel,
  tabs,
  activeKey,
  variant = 'underline',
  replaceOnChange = false,
}: RouteTabsProps) => {
  const style = VARIANT[variant];
  const { containerRef, indicatorRef } = useSlidingIndicator(
    activeKey,
    variant === 'underline' ? 'underline' : 'box',
  );

  return (
    <nav ref={containerRef} aria-label={ariaLabel} className={style.nav}>
      <span
        ref={indicatorRef}
        aria-hidden="true"
        className={cn(slidingIndicatorClass, style.indicator)}
      />
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <Link
            key={tab.key}
            to={tab.to as never}
            {...(tab.params ? { params: tab.params as never } : {})}
            {...(tab.search ? { search: tab.search as never } : {})}
            {...(replaceOnChange ? { replace: true } : {})}
            // 부모 경로가 자식 경로에서 fuzzy-active 되지 않도록 정확 매칭한다.
            activeOptions={{ exact: true }}
            aria-current={isActive ? 'page' : undefined}
            data-active={isActive}
            className={cn(
              style.item,
              'transition-colors outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
              isActive ? style.active : style.inactive,
            )}
          >
            {tab.label}
            {tab.showDot ? (
              <span
                aria-hidden="true"
                className={cn(
                  style.dot,
                  'h-[5px] w-[5px] shrink-0 rounded-full bg-destructive',
                )}
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
};
