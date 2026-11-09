import { useParams, useRouterState } from '@tanstack/react-router';
import { RouteTabs } from '@/widgets/page-header';

const TABS = [
  { key: 'calendar', label: '캘린더', to: '/band/$bandId/space/$spaceId/' },
  { key: 'poll', label: '일정 투표', to: '/band/$bandId/space/$spaceId/polls' },
] as const;

/** 투표 상세(/polls/:id)에서도 '일정 투표' 탭이 활성으로 보이게 경로로 판별한다. */
const resolveActiveKey = (pathname: string): (typeof TABS)[number]['key'] =>
  pathname.includes('/polls') ? 'poll' : 'calendar';

/** 합주 공간 공통 탭(캘린더 · 일정 투표). 헤더 renderBottom에 들어간다. */
export const SpaceTabs = () => {
  const { bandId = '', spaceId = '' } = useParams({ strict: false });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <RouteTabs
      ariaLabel="합주 공간 탭"
      variant="underline"
      activeKey={resolveActiveKey(pathname)}
      tabs={TABS.map((tab) => ({ ...tab, params: { bandId, spaceId } }))}
    />
  );
};
