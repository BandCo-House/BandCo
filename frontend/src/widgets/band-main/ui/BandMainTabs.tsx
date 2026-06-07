import { cn } from '@/shared/lib/utils';

// 아카이브/라이브러리 라우트는 아직 없어 시각 placeholder로 둔다 (홈만 활성).
const TABS = [
  { key: 'home', label: '홈' },
  { key: 'archive', label: '아카이브' },
  { key: 'library', label: '라이브러리' },
] as const;

const ACTIVE_TAB = 'home';

export const BandMainTabs = () => (
  <nav aria-label="밴드 메인 탭" className="flex w-full">
    {TABS.map((tab) => {
      const isActive = tab.key === ACTIVE_TAB;
      return (
        <button
          key={tab.key}
          type="button"
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            'flex flex-1 items-center justify-center border-b-2 pt-4 pb-5 typo-sm-sb transition-colors outline-none',
            isActive
              ? 'border-primary text-primary'
              : 'border-transparent text-grey-300',
          )}
        >
          {tab.label}
        </button>
      );
    })}
  </nav>
);
