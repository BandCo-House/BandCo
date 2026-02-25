import type { HeaderResolveContext, HeaderStaticConfig, RouteStaticData } from './types';

/**
 * 모든 라우트 헤더에 공통 적용되는 기본값
 * 개별 라우트는 필요한 필드만 선언하면 된다.
 */
const HEADER_DEFAULTS: Pick<
  HeaderStaticConfig,
  'showBack' | 'backBehavior' | 'showUtilities' | 'showSearchBar' | 'showProfileAvatar'
> = {
  showBack: true,
  backBehavior: 'route',
  showUtilities: true,
  showSearchBar: false,
  showProfileAvatar: true,
};

/**
 * 라우트 static header와 동적 resolve 결과를 병합해 최종 헤더를 만든다.
 */
export const resolveHeader = (
  staticData: RouteStaticData | undefined,
  context: HeaderResolveContext,
): HeaderStaticConfig | null => {
  const header = staticData?.header;
  if (!header) return null;

  const resolved = header.resolve?.(context);
  return {
    ...HEADER_DEFAULTS,
    ...header,
    ...resolved,
  };
};
