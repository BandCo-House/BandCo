import { Outlet, useMatches, useRouterState } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';
import {
  RouteHeader,
  type RouteStaticData,
  resolveHeader,
} from '@/widgets/page-header';
import { BottomNavBar } from '@/widgets/bottom-nav';

/** 하단 네비게이션을 표시하지 않을 경로 목록 */
const HIDDEN_NAV_PATHS = ['/login', '/signup', '/onboarding'];

const HEIGHT_MARGIN_CLASSES = {
  xs: 'mt-9',
  sm: 'mt-14',
  md: 'mt-[60px]',
  lg: 'mt-16',
};

export const RootLayout = () => {
  const matches = useMatches();
  const activeMatch = matches.at(-1);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showBottomNav = !HIDDEN_NAV_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const currentParams = (activeMatch?.params ?? {}) as Record<string, string>;

  const staticData = activeMatch?.staticData as RouteStaticData | undefined;
  const isFullBleed = staticData?.fullBleed ?? false;

  // 병합만 여기서(레이아웃 상단 여백 계산에 필요). 렌더·네비게이션은 RouteHeader가 담당한다.
  const header = resolveHeader(staticData, {
    params: currentParams,
    loaderData: activeMatch?.loaderData,
  });

  return (
    <div className="mx-auto flex min-h-dvh max-w-[648px] flex-col">
      {header ? <RouteHeader header={header} params={currentParams} /> : null}

      <main
        className={cn(
          'mx-auto min-h-0 w-full flex-1',
          !header && 'min-h-screen',
          showBottomNav && 'mb-16',
          header &&
            (header.renderBottom
              ? 'mt-[120px]'
              : HEIGHT_MARGIN_CLASSES[header.heightVariant || 'lg']),
        )}
      >
        <div
          className={cn(
            'mx-auto w-full max-w-7xl',
            !isFullBleed && 'px-5 py-8',
          )}
        >
          <Outlet />
        </div>
      </main>
      {showBottomNav ? <BottomNavBar /> : null}
    </div>
  );
};
