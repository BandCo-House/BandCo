import type { ReactNode } from 'react';

/**
 * 헤더 탭 아이템 정의
 */
export type HeaderTab = {
  key: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
  to?: string;
  getTo?: (params: Record<string, string>) => string;
  getParams?: (params: Record<string, string>) => Record<string, string>;
  activePathPrefixes?: string[];
  isActive?: (context: {
    pathname: string;
    params: Record<string, string>;
  }) => boolean;
};

/**
 * 라우트에서 동적 헤더 값을 계산할 때 사용하는 입력 컨텍스트
 */
export type HeaderResolveContext = {
  params: Record<string, string>;
  loaderData: unknown;
};

/**
 * 동적 resolve 함수가 반환할 수 있는 헤더 필드
 */
export type HeaderResolveResult = {
  title?: string | (() => ReactNode);
  /** 기본 18px(typo-lg-sb). 'lg'는 홈·내 밴드 같은 최상위 화면 전용 24px. */
  titleSize?: 'md' | 'lg';
  subtitle?: string;
  brandLabel?: string;
  meta?: string[];
  tabs?: HeaderTab[];
  rightActionLabel?: string;
  heightVariant?: 'xs' | 'sm' | 'md' | 'lg';
  renderRight?: () => ReactNode;
  renderBottom?: () => ReactNode;
  bottomBlur?: boolean;
};

/**
 * 라우트 staticData에 저장되는 헤더 설정
 */
export type HeaderStaticConfig = {
  title?: string | (() => ReactNode);
  titleSize?: 'md' | 'lg';
  subtitle?: string;
  brandLabel?: string;
  showBack?: boolean;
  backBehavior?: 'route' | 'browser';
  backTo?: string;
  getBackParams?: (params: Record<string, string>) => Record<string, string>;
  meta?: string[];
  tabs?: HeaderTab[];
  rightActionLabel?: string;
  rightActionTo?: string;
  getRightActionParams?: (
    params: Record<string, string>,
  ) => Record<string, string>;
  resolve?: (ctx: HeaderResolveContext) => HeaderResolveResult;

  heightVariant?: 'xs' | 'sm' | 'md' | 'lg';
  renderRight?: () => ReactNode;
  renderBottom?: () => ReactNode;
  bottomBlur?: boolean;
};

/**
 * TanStack Router match.staticData 확장 타입
 */
export type RouteStaticData = {
  header?: HeaderStaticConfig;
  /**
   * 본문 wrapper의 기본 패딩(px-5 py-8) 중 무엇을 흘릴지.
   * - 없음: px-5 py-8 둘 다 적용 (대부분의 화면)
   * - 'x': 가로만 흘린다. 캘린더·투표 그리드처럼 화면 끝까지 닿아야 하는 화면용.
   *        세로 여백은 레이아웃이 계속 책임지므로 헤더 아래 시작 위치가 자동으로 통일된다.
   * - 'all': 둘 다 끈다. 높이를 100dvh에 딱 맞추는 화면(로그인)이나 자체 상단 바를
   *        붙이는 화면(검색)처럼 세로 여백까지 직접 잡아야 할 때만.
   *
   * 'x'로 충분한 화면에 'all'을 쓰면 페이지마다 pt 값이 갈려 시작 위치가 어긋난다.
   */
  bleed?: 'x' | 'all';
  /**
   * 하단 네비게이션을 숨긴다. 화면 하단을 고정 CTA가 차지해 네비와 겹치거나,
   * 그 화면의 작업을 끝내기 전에는 다른 탭으로 새지 않게 하고 싶을 때 쓴다.
   * --bottom-nav-clearance도 0이 되므로 고정 CTA가 자동으로 바닥까지 내려간다.
   */
  hideBottomNav?: boolean;
};
