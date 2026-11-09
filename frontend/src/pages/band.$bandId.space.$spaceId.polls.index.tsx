import { createFileRoute } from '@tanstack/react-router';
import { SpaceHeaderTitle } from '@/widgets/space-tabs';
import { renderSpaceTabs } from './-space-header';
import { SchedulePollList } from '@/widgets/schedule-poll-list/ui/SchedulePollList';

export const Route = createFileRoute('/band/$bandId/space/$spaceId/polls/')({
  component: SchedulePollListPage,
  staticData: {
    bleed: 'x',
    header: {
      // 같은 합주의 탭이라 캘린더와 같은 제목(합주 이름)을 쓴다. 탭이 바뀌어도 앱바가 흔들리지 않는다.
      title: SpaceHeaderTitle,
      backTo: '/band/$bandId/space/$spaceId',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
        spaceId: params.spaceId,
      }),
      renderBottom: renderSpaceTabs,
    },
  },
});

// 일정 투표 탭(목록). 만들기는 목록 상단 버튼으로 들어간다.
function SchedulePollListPage() {
  const { bandId, spaceId } = Route.useParams();

  return (
    <div className="px-5">
      <SchedulePollList bandId={bandId} spaceId={spaceId} />
    </div>
  );
}
