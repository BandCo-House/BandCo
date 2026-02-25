import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/invite/request')({
  component: InviteRequestRoutePage,
  staticData: {
    header: {
      title: '초대 요청',
    },
  },
});

// 초대 요청 라우트 전용 화면
function InviteRequestRoutePage() {
  return <div>InviteRequestPage</div>;
}
