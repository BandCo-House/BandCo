import { createFileRoute } from '@tanstack/react-router';
import { renderSpaceTabs } from './-space-header';
import { SchedulePollList } from '@/widgets/schedule-poll-list/ui/SchedulePollList';

export const Route = createFileRoute('/band/$bandId/space/$spaceId/polls/')({
  component: SchedulePollListPage,
  staticData: {
    bleed: 'x',
    header: {
      title: '일정 투표',
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
