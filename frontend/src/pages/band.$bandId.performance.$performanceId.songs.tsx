import { createFileRoute } from '@tanstack/react-router';
import { bandPerformanceTabs, resolvePerformanceHeader } from './band.$bandId';

export const Route = createFileRoute('/band/$bandId/performance/$performanceId/songs')({
  component: PerformanceSongsRoutePage,
  staticData: {
    header: {
      title: '공연 상세',
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
      resolve: resolvePerformanceHeader,
    },
  },
});

// 공연 상세 하위 곡 라이브러리 라우트 전용 화면
function PerformanceSongsRoutePage() {
  return <div>SongsPage</div>;
}
