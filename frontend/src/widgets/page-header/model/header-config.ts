import type {
  HeaderStaticConfig,
  RouteStaticData,
} from '@/widgets/page-header/model/types';

// 라우트 정의에 헤더 staticData를 주입하는 헬퍼
export const withHeader = <T extends object>(
  options: T,
  header: HeaderStaticConfig,
): T & { staticData: RouteStaticData } => {
  return {
    ...options,
    staticData: { header },
  };
};

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

export const createHeaderConfig = (config: HeaderStaticConfig): HeaderStaticConfig => {
  return {
    ...HEADER_DEFAULTS,
    ...config,
  };
};
