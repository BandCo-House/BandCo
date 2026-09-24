import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { SpaceTabs } from '@/widgets/space-tabs';
import { SchedulePollCreateForm } from '@/features/schedule-poll-create/ui/SchedulePollCreateForm';

export const Route = createFileRoute('/band/$bandId/space/$spaceId/polls/new')({
  component: SchedulePollCreatePage,
  staticData: {
    fullBleed: true,
    header: {
      title: '일정 투표',
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

// 일정 투표 생성 탭
function SchedulePollCreatePage() {
  const { bandId, spaceId } = Route.useParams();
  const navigate = useNavigate();

  return (
    <div className="px-5 py-6 pb-12">
      <SchedulePollCreateForm
        spaceId={spaceId}
        onCreated={() =>
          navigate({
            to: '/band/$bandId/space/$spaceId/polls',
            params: { bandId, spaceId },
          })
        }
      />
    </div>
  );
}
