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
  /** 본문 wrapper의 기본 패딩(px-5 py-8)을 제거하고 페이지가 직접 패딩을 관리한다. */
  fullBleed?: boolean;
};
