import { createFileRoute } from '@tanstack/react-router';
import { SpaceTabs } from '@/widgets/space-tabs';
import { SchedulePollList } from '@/widgets/schedule-poll-list/ui/SchedulePollList';

export const Route = createFileRoute('/band/$bandId/space/$spaceId/polls/')({
  component: SchedulePollListPage,
  staticData: {
    fullBleed: true,
    header: {
      title: '투표 목록',
      titleSize: 'md',
      bottomBlur: true,
      backTo: '/band/$bandId/space/$spaceId',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
        spaceId: params.spaceId,
      }),
      renderBottom: () => <SpaceTabs />,
    },
  },
});

// 투표 목록 탭
function SchedulePollListPage() {
  const { bandId, spaceId } = Route.useParams();

  return (
    <div className="px-5 py-6">
      <SchedulePollList bandId={bandId} spaceId={spaceId} />
    </div>
  );
}
