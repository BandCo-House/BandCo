import { createFileRoute } from '@tanstack/react-router';
import { ComingSoon } from '@/shared/ui/coming-soon';

export const Route = createFileRoute('/band/$bandId/settings')({
  component: BandSettingsRoutePage,
  staticData: {
    header: {
      title: '밴드 설정',
      backTo: '/band/$bandId',
    },
  },
});

// 밴드 설정 라우트 전용 화면
function BandSettingsRoutePage() {
  return (
    <>
      <span className="sr-only">BandSettingsPage</span>
      <ComingSoon />
    </>
  );
}
