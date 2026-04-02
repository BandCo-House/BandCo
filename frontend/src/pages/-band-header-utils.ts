import type {
  HeaderResolveContext,
  HeaderResolveResult,
  HeaderTab,
} from '@/widgets/page-header';

type BandTabParams = {
  bandId: string;
  spaceId?: string;
};

type SongsSearch = {
  performanceId?: string;
};

/**
 * HeaderTab에서 전달하는 느슨한 params를 밴드 탭 전용 형태로 정규화한다.
 * bandId는 라우트 필수 파라미터이므로 문자열로 강제하고,
 * spaceId는 songs 화면에서는 없을 수 있어 optional로 둔다.
 */
const toBandTabParams = (params: Record<string, string>): BandTabParams => ({
  bandId: params.bandId,
  spaceId: params.spaceId,
});

/**
 * 곡 라이브러리 진입 URL을 생성한다.
 * spaceId가 있으면 search로 유지해 캘린더 복귀 컨텍스트를 보존한다.
 */
const buildSongsPath = ({ bandId, spaceId }: BandTabParams): string =>
  spaceId
    ? `/band/${bandId}/songs?performanceId=${spaceId}`
    : `/band/${bandId}/songs`;

/**
 * 공연 캘린더 경로를 생성한다.
 */
const buildPerformancePath = ({ bandId, spaceId }: BandTabParams): string =>
  `/band/${bandId}/space/${spaceId}`;

/**
 * 공연 상세 화면에서 사용하는 공통 탭 세트.
 * - calendar: 현재 spaceId로 공연 캘린더 라우트 이동
 * - songs: 밴드 공용 songs 라우트로 이동하되 performanceId search로 복귀 컨텍스트를 유지
 */
export const bandPerformanceTabs: HeaderTab[] = [
  {
    key: 'calendar',
    label: '캘린더',
    to: '/band/$bandId/space/$spaceId',
    getParams: (params: Record<string, string>) => {
      const { bandId, spaceId } = toBandTabParams(params);
      return {
        bandId,
        spaceId: spaceId ?? '',
      };
    },
    isActive: ({ pathname, params }) => {
      const normalized = toBandTabParams(params);
      if (!normalized.spaceId) return false;
      return pathname === buildPerformancePath(normalized);
    },
  },
  {
    key: 'songs',
    label: '곡 라이브러리',
    getTo: (params: Record<string, string>) => buildSongsPath(toBandTabParams(params)),
    isActive: ({ pathname, params }) => {
      const { bandId } = toBandTabParams(params);
      return pathname === `/band/${bandId}/songs`;
    },
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
      typeof band?.memberCount === 'number' &&
      typeof band?.performanceCount === 'number'
        ? [`멤버 ${band.memberCount}명`, `공연 ${band.performanceCount}회`]
        : undefined,
  };
};

/**
 * 공연 상세 헤더 동적 해석기
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

/**
 * songs 라우트의 search를 단일 형태로 정규화한다.
 * 문자열/배열/기타 타입이 들어와도 string 하나만 허용한다.
 */
export const parseSongsSearch = (search: Record<string, unknown>): SongsSearch => ({
  performanceId:
    typeof search.performanceId === 'string' ? search.performanceId : undefined,
});

/**
 * TanStack Router의 location.search가 런타임에 문자열/객체 모두 가능해서
 * 두 형태를 모두 처리해 performanceId를 안전하게 추출한다.
 */
export const getPerformanceIdFromLocationSearch = (
  rawSearch: unknown,
): string | undefined => {
  if (typeof rawSearch === 'string') {
    const query = rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch;
    return new URLSearchParams(query).get('performanceId') ?? undefined;
  }

  if (
    rawSearch &&
    typeof rawSearch === 'object' &&
    'performanceId' in rawSearch &&
    typeof rawSearch.performanceId === 'string'
  ) {
    return rawSearch.performanceId;
  }

  return undefined;
};

/**
 * songs 화면 전용 헤더 해석기
 * songs URL에 실린 performanceId(search)를 읽어 캘린더 탭 복귀 대상을 결정한다.
 */
export const resolveSongsHeader = ({
  params,
  loaderData,
}: HeaderResolveContext): HeaderResolveResult => {
  const songsData = loaderData as SongsSearch | undefined;
  const bandId = params.bandId;
  const performanceId = songsData?.performanceId;

  const calendarPath = performanceId
    ? `/band/${bandId}/space/${performanceId}`
    : `/band/${bandId}`;
  const songsPath = performanceId
    ? `/band/${bandId}/songs?performanceId=${performanceId}`
    : `/band/${bandId}/songs`;

  return {
    tabs: [
      {
        key: 'calendar',
        label: '캘린더',
        to: calendarPath,
        isActive: ({ pathname }) => pathname === calendarPath,
      },
      {
        key: 'songs',
        label: '곡 라이브러리',
        to: songsPath,
        isActive: ({ pathname }) => pathname === `/band/${bandId}/songs`,
      },
    ],
  };
};
