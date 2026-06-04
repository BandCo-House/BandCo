import { createFileRoute } from '@tanstack/react-router';
import { resolveBandDetailHeader } from './-band-header-utils';

export const Route = createFileRoute('/band/$bandId/')({
  component: BandDetailRoutePage,
  staticData: {
    header: {
      title: '밴드',
      brandLabel: '밴드',
      backTo: '/',
      rightActionLabel: '밴드 설정',
      rightActionTo: '/band/$bandId/settings',
      getRightActionParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
      resolve: resolveBandDetailHeader,
    },
  },
});

// 밴드 상세 라우트 전용 화면
function BandDetailRoutePage() {
  return (
    <div className="flex-1 overflow-hidden p-6">
      <span className="sr-only">BandDetailPage</span>
    </div>
  );
}
