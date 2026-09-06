import { Link, useParams, useSearch } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';
import { BAND_SETTINGS_TABS } from '../model/tabs';
import { useBandSettingsAccess } from '../model/useBandSettingsAccess';

/**
 * 밴드 설정 탭. 활성 탭을 route search(`?tab=`)에 두어
 * 헤더(RouteHeader.renderBottom)에서도 상태 공유 없이 그릴 수 있게 한다.
 */
export const BandSettingsTabs = () => {
  const { bandId } = useParams({ from: '/band/$bandId/settings' });
  const { tab } = useSearch({ from: '/band/$bandId/settings' });
  const { allowedTabs } = useBandSettingsAccess(bandId);

  const visibleTabs = BAND_SETTINGS_TABS.filter((item) =>
    allowedTabs.includes(item.key),
  );

  return (
    <nav aria-label="밴드 설정 탭" className="flex w-full">
      {visibleTabs.map((item) => {
        const isActive = item.key === tab;
        return (
          <Link
            key={item.key}
            to="/band/$bandId/settings"
            params={{ bandId }}
            search={{ tab: item.key }}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-1 items-center justify-center border-b-2 pt-4 pb-5 typo-sm-sb transition-colors outline-none',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-grey-300',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};
