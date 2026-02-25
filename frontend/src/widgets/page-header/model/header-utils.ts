import type {
  HeaderResolveContext,
  HeaderResolveResult,
  HeaderStaticConfig,
  HeaderTab,
  RouteStaticData,
} from './types';

/**
 * 밴드/공연 하위 화면에서 공통으로 재사용하는 탭 정의
 * 두 탭 모두 현재 bandId/performanceId 파라미터를 유지한 채 이동한다.
 * active 상태는 실제 pathname 기반으로 계산해 일관성을 맞춘다.
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
 * 라우트 static header와 동적 resolve 결과를 병합하는 공통 해석기
 * header가 없으면 null을 반환한다.
 * header.resolve가 있으면 결과를 우선 병합해 최종 헤더를 만든다.
 */
export const resolveHeader = (
  staticData: RouteStaticData | undefined,
  context: HeaderResolveContext,
): HeaderStaticConfig | null => {
  const header = staticData?.header;
  if (!header) return null;

  const resolved = header.resolve?.(context);
  return {
    ...header,
    ...resolved,
  };
};

/**
 * 밴드 상세의 동적 헤더 정보 해석
 * loaderData에서 밴드명/메타 정보를 추출해 헤더 제목/메타에 반영한다.
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
 * 공연 상세/곡 라이브러리의 동적 헤더 정보 해석
 * loaderData에서 공연 제목/부제를 추출해 헤더에 반영한다.
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
