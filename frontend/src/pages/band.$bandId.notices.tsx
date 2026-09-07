import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/band/$bandId/notices')({
  component: BandNoticesRoutePage,
  staticData: {
    header: {
      title: '공지',
      showBack: true,
      backTo: '/band/$bandId',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
    },
  },
});

function BandNoticesRoutePage() {
  return (
    <div className="py-10 text-center">
      <span data-testid="band-notices-page" className="hidden" />
      <p className="typo-sm-r text-grey-300">공지 페이지 구현 예정입니다.</p>
    </div>
  );
}
