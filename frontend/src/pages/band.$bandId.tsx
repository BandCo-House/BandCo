/* eslint-disable react-refresh/only-export-components */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { allowBandAccess } from '@/app/router-guards';
import type { HeaderResolveContext, HeaderResolveResult, HeaderTab } from '@/widgets/page-header';

export const Route = createFileRoute('/band/$bandId')({
  beforeLoad: allowBandAccess,
  component: Outlet,
});

/**
 * 밴드 공연 화면(캘린더/곡 라이브러리) 공통 탭
 * 라우트 파라미터를 유지하면서 같은 공연 내 하위 화면만 전환한다.
 */
export const bandPerformanceTabs: HeaderTab[] = [
  {
    key: 'calendar',
    label: '캘린더',
    to: '/band/$bandId/performance/$performanceId',
    getParams: (params: Record<string, string>) => ({
      bandId: params.bandId,
      performanceId: params.performanceId,
    }),
    isActive: ({ pathname, params }) =>
      pathname === `/band/${params.bandId}/performance/${params.performanceId}`,
  },
  {
    key: 'songs',
    label: '곡 라이브러리',
    to: '/band/$bandId/performance/$performanceId/songs',
    getParams: (params: Record<string, string>) => ({
      bandId: params.bandId,
      performanceId: params.performanceId,
    }),
    isActive: ({ pathname, params }) =>
      pathname === `/band/${params.bandId}/performance/${params.performanceId}/songs`,
  },
];

/**
 * 밴드 상세 헤더 동적 해석기
 * loaderData에서 밴드명/멤버 수/공연 수를 읽어 제목/메타를 계산한다.
 */
export const resolveBandDetailHeader = ({
  loaderData,
}: HeaderResolveContext): HeaderResolveResult => {
  const band = loaderData as
    | {
        name?: string;
        memberCount?: number;
        performanceCount?: number;
      }
    | undefined;

  return {
    title: band?.name,
    meta:
      typeof band?.memberCount === 'number' && typeof band?.performanceCount === 'number'
        ? [`멤버 ${band.memberCount}명`, `공연 ${band.performanceCount}회`]
        : undefined,
  };
};

/**
 * 공연 상세/곡 라이브러리 헤더 동적 해석기
 * loaderData에서 공연 제목/부제를 읽어 헤더에 반영한다.
 */
export const resolvePerformanceHeader = ({
  loaderData,
}: HeaderResolveContext): HeaderResolveResult => {
  const performance = loaderData as
    | {
        title?: string;
        subtitle?: string;
      }
    | undefined;

  return {
    title: performance?.title,
    subtitle: performance?.subtitle,
  };
};
