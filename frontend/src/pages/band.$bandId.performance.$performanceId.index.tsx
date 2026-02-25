import { createFileRoute } from '@tanstack/react-router';
import { bandPerformanceTabs, resolvePerformanceHeader } from './band.$bandId';

export const Route = createFileRoute('/band/$bandId/performance/$performanceId/')({
  component: BandPerformanceRoutePage,
  staticData: {
    header: {
      title: '공연 상세',
      backTo: '/band/$bandId',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
      tabs: bandPerformanceTabs,
      rightActionLabel: '설정',
      rightActionTo: '/band/$bandId/performance/$performanceId/settings',
      getRightActionParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
        performanceId: params.performanceId,
      }),
      resolve: resolvePerformanceHeader,
    },
  },
});

// 공연 상세(캘린더) 라우트 전용 화면
function BandPerformanceRoutePage() {
  return <div>BandPerformancePage</div>;
}
