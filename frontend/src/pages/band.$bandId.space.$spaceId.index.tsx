import { createFileRoute } from '@tanstack/react-router';
import { SpaceCalendar } from '@/widgets/space-calendar/ui/SpaceCalendar';

export const Route = createFileRoute('/band/$bandId/space/$spaceId/')({
  component: BandPerformanceRoutePage,
  staticData: {
    // 페이지가 직접 패딩을 관리한다(공통 본문 px-5 py-8 제거).
    fullBleed: true,
    header: {
      // 공간 이름/설명은 본문 요약 헤더에서 보여주므로 앱바 제목은 작은 고정 라벨을 쓴다.
      title: '내 합주',
      titleSize: 'md',
      // 합주 메인은 스크롤 시 sticky 필터 바가 글로우를 이어받으므로 앱바 자체 글로우는 끈다.
      bottomBlur: false,
      backTo: '/band/$bandId',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
    },
  },
});

// 공연 상세(캘린더) 라우트 전용 화면
function BandPerformanceRoutePage() {
  return (
    <div>
      <span className="sr-only">BandPerformancePage</span>
      <SpaceCalendar />
    </div>
  );
}
