import { Link, useParams, useRouterState } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';

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
  const activeKey = resolveActiveKey(pathname);

  return (
    <nav aria-label="밴드 메인 탭" className="flex w-full">
      {TABS.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <Link
            key={tab.key}
            to={tab.to}
            params={{ bandId }}
            // 홈(`/band/$bandId`)이 자식 경로에서 fuzzy-active 되지 않도록 정확 매칭한다.
            activeOptions={{ exact: true }}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-1 items-center justify-center border-b-2 pt-4 pb-5 typo-sm-sb transition-colors outline-none',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-grey-300',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};
