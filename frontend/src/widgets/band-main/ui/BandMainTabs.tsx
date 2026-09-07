import { useParams, useRouterState } from '@tanstack/react-router';
import { RouteTabs } from '@/widgets/page-header';

const TABS = [
  { key: 'home', label: '홈', to: '/band/$bandId' },
  { key: 'archive', label: '아카이브', to: '/band/$bandId/archive' },
  { key: 'library', label: '라이브러리', to: '/band/$bandId/library' },
] as const;

/** 현재 경로의 마지막 세그먼트로 활성 탭을 판별한다 (홈은 하위 세그먼트가 없음). */
const resolveActiveKey = (pathname: string): (typeof TABS)[number]['key'] => {
  if (pathname.endsWith('/archive')) return 'archive';
  if (pathname.endsWith('/library')) return 'library';
  return 'home';
};

export const BandMainTabs = () => {
  const { bandId } = useParams({ from: '/band/$bandId' });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <RouteTabs
      ariaLabel="밴드 메인 탭"
      variant="underline"
      activeKey={resolveActiveKey(pathname)}
      tabs={TABS.map((tab) => ({ ...tab, params: { bandId } }))}
    />
  );
};
