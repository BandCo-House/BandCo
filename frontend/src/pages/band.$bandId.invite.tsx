import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/band/$bandId/invite')({
  component: BandInviteRoutePage,
  staticData: {
    header: {
      title: '밴드 초대',
      backTo: '/',
    },
  },
});

// 밴드 초대 라우트 전용 화면
function BandInviteRoutePage() {
  return <div>BandInvitePage</div>;
}
