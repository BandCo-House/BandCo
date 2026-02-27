import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/band/$bandId/performance/$performanceId/settings')({
  component: PerformanceSettingsRoutePage,
  staticData: {
    header: {
      title: '공연 설정',
      backTo: '/band/$bandId/performance/$performanceId',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
        performanceId: params.performanceId,
      }),
    },
  },
});

// 공연 설정 라우트 전용 화면
function PerformanceSettingsRoutePage() {
  return <div>PerformanceSettingsPage</div>;
}
