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
      <span className="sr-only">BandNoticesPage</span>
      <p className="typo-sm-r text-grey-300">공지 페이지 구현 예정입니다.</p>
    </div>
  );
}
