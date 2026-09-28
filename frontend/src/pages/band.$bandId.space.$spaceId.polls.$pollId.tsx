import { createFileRoute } from '@tanstack/react-router';
import { renderSpaceTabs } from './-space-header';
import { SchedulePollDetail } from '@/widgets/schedule-poll-detail/ui/SchedulePollDetail';
import { SchedulePollDeleteAction } from '@/widgets/schedule-poll-detail/ui/SchedulePollDeleteAction';
import { SchedulePollHeaderTitle } from '@/widgets/schedule-poll-detail/ui/SchedulePollHeaderTitle';

export const Route = createFileRoute(
  '/band/$bandId/space/$spaceId/polls/$pollId',
)({
  component: SchedulePollDetailPage,
  staticData: {
    bleed: 'x',
    // 하단이 투표 CTA로 고정돼 네비와 겹친다. 투표를 마치기 전에 다른 탭으로
    // 새지 않게 하는 의도도 같이 있다(일정 상세 수정 화면과 같은 처리).
    hideBottomNav: true,
    header: {
      title: SchedulePollHeaderTitle,
      renderRight: () => <SchedulePollDeleteAction />,
      backTo: '/band/$bandId/space/$spaceId/polls',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
        spaceId: params.spaceId,
      }),
      renderBottom: renderSpaceTabs,
    },
  },
});

// 투표 상세(득표 현황 + 내 투표 편집)
function SchedulePollDetailPage() {
  const { spaceId, pollId } = Route.useParams();

  return (
    <div>
      <SchedulePollDetail spaceId={spaceId} pollId={pollId} />
    </div>
  );
}
