import { createFileRoute } from '@tanstack/react-router';
import { bandPerformanceTabs } from './band.$bandId';

export const Route = createFileRoute('/band/$bandId/songs')({
  component: BandSongsRoutePage,
  staticData: {
    header: {
      title: '곡 라이브러리',
      backTo: '/band/$bandId',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
      tabs: bandPerformanceTabs,
      rightActionLabel: '설정',
      rightActionTo: '/band/$bandId/settings',
      getRightActionParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
    },
  },
});

// 밴드 공용 곡 라이브러리 라우트 전용 화면
function BandSongsRoutePage() {
  return <div>SongsPage</div>;
}
