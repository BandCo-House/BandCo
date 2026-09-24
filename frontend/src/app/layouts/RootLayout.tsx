import { useLayoutEffect } from 'react';
import { Outlet, useMatches, useRouterState } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';
import {
  RouteHeader,
  type RouteStaticData,
  resolveHeader,
} from '@/widgets/page-header';
import { BottomNavBar } from '@/widgets/bottom-nav';

/** 하단 네비게이션을 표시하지 않을 경로 목록 */
const HIDDEN_NAV_PATHS = [
  '/login',
  '/signup',
  '/onboarding',
  '/forgot-password',
];

// 헤더(fixed)가 safe area만큼 아래로 밀리므로 본문 상단 여백에도 같은 값을 더한다.
const HEIGHT_MARGIN_CLASSES = {
  xs: 'mt-[calc(2.25rem_+_env(safe-area-inset-top))]',
  sm: 'mt-[calc(3.5rem_+_env(safe-area-inset-top))]',
  md: 'mt-[calc(60px_+_env(safe-area-inset-top))]',
  lg: 'mt-[calc(4rem_+_env(safe-area-inset-top))]',
};

export const RootLayout = () => {
  const matches = useMatches();
  const activeMatch = matches.at(-1);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showBottomNav = !HIDDEN_NAV_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // 네비 높이를 CSS 변수로 노출한다. 레이아웃 밖(토스트)이나 페이지 안(프로필)에서
  // "네비를 뺀 화면 높이"가 필요할 때 4.5rem 상수를 복제하지 않고 이 변수를 쓴다.
  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      '--bottom-nav-clearance',
      showBottomNav ? 'calc(4.5rem + env(safe-area-inset-bottom))' : '0px',
    );
  }, [showBottomNav]);
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
          // 높이는 부모(min-h-dvh flex-col)의 flex-1 스트레치가 잡는다. 여기에
          // min-h-screen(100vh)을 얹으면 모바일 주소창 높이 + 네비 mb만큼 실제
          // 화면보다 커져 콘텐츠가 없어도 유령 스크롤이 생긴다.
          'mx-auto min-h-0 w-full flex-1',
          !header && 'pt-[env(safe-area-inset-top)]',
          // 4.5rem = BottomNavBar의 h-18. 값이 어긋나면 마지막 콘텐츠가 네비 뒤에 가려진다.
          showBottomNav && 'mb-[calc(4.5rem_+_env(safe-area-inset-bottom))]',
          header &&
            (header.renderBottom
              ? 'mt-[calc(120px_+_env(safe-area-inset-top))]'
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
