import type {
  HeaderResolveContext,
  HeaderResolveResult,
} from '@/widgets/page-header';

type SongsSearch = {
  spaceId?: string;
};

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
 * songs 라우트의 search를 단일 형태로 정규화한다.
 * 문자열/배열/기타 타입이 들어와도 string 하나만 허용한다.
 */
export const parseSongsSearch = (
  search: Record<string, unknown>,
): SongsSearch => ({
  spaceId: typeof search.spaceId === 'string' ? search.spaceId : undefined,
});

/**
 * TanStack Router의 location.search가 런타임에 문자열/객체 모두 가능해서
 * 두 형태를 모두 처리해 spaceId를 안전하게 추출한다.
 */
export const getSpaceIdFromLocationSearch = (
  rawSearch: unknown,
): string | undefined => {
  if (typeof rawSearch === 'string') {
    const query = rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch;
    return new URLSearchParams(query).get('spaceId') ?? undefined;
  }

  if (
    rawSearch &&
    typeof rawSearch === 'object' &&
    'spaceId' in rawSearch &&
    typeof rawSearch.spaceId === 'string'
  ) {
    return rawSearch.spaceId;
  }

  return undefined;
};

/**
 * songs 화면 전용 헤더 해석기
 * songs URL에 실린 spaceId(search)를 읽어 캘린더 탭 복귀 대상을 결정한다.
 */
export const resolveSongsHeader = ({
  params,
  loaderData,
}: HeaderResolveContext): HeaderResolveResult => {
  const songsData = loaderData as SongsSearch | undefined;
  const bandId = params.bandId;
  const spaceId = songsData?.spaceId;

  const calendarPath = spaceId
    ? `/band/${bandId}/space/${spaceId}`
    : `/band/${bandId}`;
  const songsPath = spaceId
    ? `/band/${bandId}/songs?spaceId=${spaceId}`
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
