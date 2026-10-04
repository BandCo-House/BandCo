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

// 헤더가 실측되기 전(첫 페인트) 쓰는 폴백. RouteHeader의 HEIGHT_CLASSES와 같은 값이고,
// 실측이 들어오는 순간 --route-header-height가 이 값을 덮는다.
// 헤더(fixed)가 safe area만큼 아래로 밀리므로 여기에도 같은 값을 더한다.
const HEIGHT_FALLBACKS = {
  xs: '2.25rem',
  sm: '3.5rem',
  md: '60px',
  lg: '4rem',
};

export const RootLayout = () => {
  const matches = useMatches();
  const activeMatch = matches.at(-1);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const staticData = activeMatch?.staticData as RouteStaticData | undefined;
  const showBottomNav =
    !HIDDEN_NAV_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    ) && !staticData?.hideBottomNav;

  // 네비 높이를 CSS 변수로 노출한다. 레이아웃 밖(토스트)이나 페이지 안(프로필)에서
  // "네비를 뺀 화면 높이"가 필요할 때 4.5rem 상수를 복제하지 않고 이 변수를 쓴다.
  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      '--bottom-nav-clearance',
      showBottomNav ? 'calc(4.5rem + env(safe-area-inset-bottom))' : '0px',
    );
  }, [showBottomNav]);
  const currentParams = (activeMatch?.params ?? {}) as Record<string, string>;
  const bleed = staticData?.bleed;

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
          // 네비가 없는 화면(로그인·가입 등)은 하단 safe area를 아무도 안 잡아줘서
          // 마지막 줄이 홈 인디케이터·브라우저 툴바에 물린다. 네비가 있을 땐 위 mb가 이미 포함.
          !showBottomNav && 'pb-[env(safe-area-inset-bottom)]',
        )}
        style={
          header
            ? {
                // 실측 높이에는 헤더의 pt(safe-area-inset-top)가 이미 포함돼 있다.
                // 폴백에만 safe area를 따로 더한다.
                marginTop: `var(--route-header-height, calc(${
                  header.renderBottom
                    ? // 탭 등 하단 영역이 붙으면 기본 높이 + 그 영역. 폴백이라 대략치면 된다.
                      '120px'
                    : HEIGHT_FALLBACKS[header.heightVariant || 'lg']
                } + env(safe-area-inset-top)))`,
              }
            : undefined
        }
      >
        <div
          className={cn(
            'mx-auto w-full max-w-7xl',
            !bleed && 'px-5',
            // 세로 여백은 bleed='all'일 때만 페이지에 넘긴다. 가로만 흘리는 화면까지
            // py-8을 넘기면 페이지마다 pt 값이 갈려 헤더 아래 시작 위치가 어긋난다.
            bleed !== 'all' && 'py-8',
          )}
        >
          <Outlet />
        </div>
      </main>
      {showBottomNav ? <BottomNavBar /> : null}
    </div>
  );
};
