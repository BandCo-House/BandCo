import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/band/$bandId/settings')({
  component: BandSettingsRoutePage,
  staticData: {
    header: {
      title: '밴드 설정',
      backTo: '/',
    },
  },
});

// 밴드 설정 라우트 전용 화면
function BandSettingsRoutePage() {
  return <div>BandSettingsPage</div>;
}
