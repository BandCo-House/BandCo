import { createFileRoute } from '@tanstack/react-router';
import {
  bandPerformanceTabs,
  resolvePerformanceHeader,
} from './-band-header-utils';
import { WeeklyCalendar } from '@/widgets/weekly-calendar/ui/WeeklyCalendar';

export const Route = createFileRoute('/band/$bandId/space/$spaceId/')({
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
      rightActionTo: '/band/$bandId/space/$spaceId/settings',
      getRightActionParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
        spaceId: params.spaceId,
      }),
      resolve: resolvePerformanceHeader,
    },
  },
});

// 공연 상세(캘린더) 라우트 전용 화면
function BandPerformanceRoutePage() {
  return (
    <div>
      <span className="sr-only">BandPerformancePage</span>
      <WeeklyCalendar />
    </div>
  );
}
