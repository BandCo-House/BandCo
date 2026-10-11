import { createFileRoute } from '@tanstack/react-router';
import { renderSpaceTabs } from './-space-header';
import { SpaceCalendar } from '@/widgets/space-calendar/ui/SpaceCalendar';
import { SpaceEditAction } from '@/widgets/space-calendar/ui/SpaceEditAction';

export const Route = createFileRoute('/band/$bandId/space/$spaceId/')({
  component: BandPerformanceRoutePage,
  staticData: {
    // 캘린더가 화면 끝까지 닿아야 해서 가로 여백만 흘린다(세로는 레이아웃이 유지).
    bleed: 'x',
    header: {
      // 공간 이름/설명은 본문 요약 헤더에서 보여주므로 앱바 제목은 작은 고정 라벨을 쓴다.
      title: '내 합주',
      backTo: '/band/$bandId',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
      renderRight: () => <SpaceEditAction />,
      renderBottom: renderSpaceTabs,
    },
  },
});

// 공연 상세(캘린더) 라우트 전용 화면
function BandPerformanceRoutePage() {
  return (
    <div>
      <span data-testid="band-performance-page" className="hidden" />
      <SpaceCalendar />
    </div>
  );
}
