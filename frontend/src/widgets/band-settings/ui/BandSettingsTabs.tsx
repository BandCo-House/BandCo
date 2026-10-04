import { useParams, useSearch } from '@tanstack/react-router';
import { RouteTabs } from '@/widgets/page-header';
import { BAND_SETTINGS_TABS } from '../model/tabs';
import { useBandSettingsAccess } from '../model/useBandSettingsAccess';

/**
 * 밴드 설정 탭. 활성 탭을 route search(`?tab=`)에 두어
 * 헤더(RouteHeader.renderBottom)에서도 상태 공유 없이 그릴 수 있게 한다.
 *
 * 밴드 메인·스페이스와 같은 공통 RouteTabs를 쓴다. 직접 그리던 때는 밑줄이 탭마다
 * 뚝뚝 끊겨 나타났는데, 공통 컴포넌트는 인디케이터 하나를 옮겨 슬라이드시킨다.
 * 탭이 같은 라우트의 search만 바꾸므로 replaceOnChange를 켠다 — 안 켜면 탭을 누를
 * 때마다 히스토리가 쌓여 뒤로가기가 설정 화면을 못 벗어난다.
 */
export const BandSettingsTabs = () => {
  const { bandId } = useParams({ from: '/band/$bandId/settings' });
  const { tab } = useSearch({ from: '/band/$bandId/settings' });
  const { allowedTabs } = useBandSettingsAccess(bandId);

  const visibleTabs = BAND_SETTINGS_TABS.filter((item) =>
    allowedTabs.includes(item.key),
  ).map((item) => ({
    key: item.key,
    label: item.label,
    to: '/band/$bandId/settings',
    params: { bandId },
    search: { tab: item.key },
  }));

  return (
    <RouteTabs
      ariaLabel="밴드 설정 탭"
      variant="underline"
      activeKey={tab}
      tabs={visibleTabs}
      replaceOnChange
    />
  );
};
