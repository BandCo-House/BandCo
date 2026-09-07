import { createFileRoute } from '@tanstack/react-router';
import {
  BandSettings,
  BandSettingsSaveAction,
  BandSettingsTabs,
  parseBandSettingsTab,
} from '@/widgets/band-settings';

export const Route = createFileRoute('/band/$bandId/settings')({
  component: BandSettingsRoutePage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: parseBandSettingsTab(search.tab),
  }),
  staticData: {
    header: {
      title: '밴드 설정',
      titleSize: 'md',
      backTo: '/band/$bandId',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
      renderRight: () => <BandSettingsSaveAction />,
      renderBottom: () => <BandSettingsTabs />,
    },
  },
});

// 밴드 설정 라우트 전용 화면
function BandSettingsRoutePage() {
  return (
    <>
      <span data-testid="band-settings-page" className="hidden" />
      <BandSettings />
    </>
  );
}
