import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/invite/accept')({
  component: InviteAcceptRoutePage,
  staticData: {
    header: {
      title: '초대 수락',
      showProfileAvatar: false,
    },
  },
});

// 초대 수락 라우트 전용 화면
function InviteAcceptRoutePage() {
  return <div>InviteAcceptPage</div>;
}
