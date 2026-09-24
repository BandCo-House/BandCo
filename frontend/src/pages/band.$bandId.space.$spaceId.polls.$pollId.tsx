import { createFileRoute } from '@tanstack/react-router';
import { getSchedulePoll } from '@/entities/schedule-poll/api';
import type { HeaderResolveContext } from '@/widgets/page-header';
import { SpaceTabs } from '@/widgets/space-tabs';
import { SchedulePollDetail } from '@/widgets/schedule-poll-detail/ui/SchedulePollDetail';
import { SchedulePollDeleteAction } from '@/widgets/schedule-poll-detail/ui/SchedulePollDeleteAction';

export const Route = createFileRoute(
  '/band/$bandId/space/$spaceId/polls/$pollId',
)({
  component: SchedulePollDetailPage,
  // 앱바 제목에 투표 이름을 쓰기 위해 로더로 상세를 받아 resolve에 넘긴다.
  loader: ({ params }) => getSchedulePoll(params.pollId),
  staticData: {
    fullBleed: true,
    header: {
      title: '일정 투표',
      titleSize: 'md',
      resolve: ({ loaderData }: HeaderResolveContext) => ({
        title: (loaderData as { name?: string } | undefined)?.name,
      }),
      renderRight: () => <SchedulePollDeleteAction />,
      bottomBlur: true,
      backTo: '/band/$bandId/space/$spaceId/polls',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
        spaceId: params.spaceId,
      }),
      renderBottom: () => <SpaceTabs />,
    },
  },
});

// 투표 상세(득표 현황 + 내 투표 편집)
function SchedulePollDetailPage() {
  const { spaceId, pollId } = Route.useParams();

  return (
    <div className="py-6">
      <SchedulePollDetail spaceId={spaceId} pollId={pollId} />
    </div>
  );
}
