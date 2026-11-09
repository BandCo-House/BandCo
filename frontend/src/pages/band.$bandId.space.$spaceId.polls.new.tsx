import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { SchedulePollCreateForm } from '@/features/schedule-poll-create/ui/SchedulePollCreateForm';

export const Route = createFileRoute('/band/$bandId/space/$spaceId/polls/new')({
  component: SchedulePollCreatePage,
  staticData: {
    bleed: 'x',
    header: {
      title: '새 일정 투표',
      // 목록에서 들어오는 하위 화면이라 탭을 두지 않는다. 탭이 있으면 작성 중에
      // 다른 탭으로 빠져 입력이 날아간다.
      backTo: '/band/$bandId/space/$spaceId/polls',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
        spaceId: params.spaceId,
      }),
    },
  },
});

// 일정 투표 생성
function SchedulePollCreatePage() {
  const { bandId, spaceId } = Route.useParams();
  const navigate = useNavigate();

  return (
    <div className="px-5 pb-12">
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
