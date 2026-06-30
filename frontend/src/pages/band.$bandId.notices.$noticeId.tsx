import { createFileRoute, useParams } from '@tanstack/react-router';

export const Route = createFileRoute('/band/$bandId/notices/$noticeId')({
  component: BandNoticeDetailRoutePage,
  staticData: {
    header: {
      title: '공지',
      showBack: true,
      backTo: '/band/$bandId/notices',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
    },
  },
});

function BandNoticeDetailRoutePage() {
  const { noticeId } = useParams({ from: '/band/$bandId/notices/$noticeId' });
  return (
    <div className="py-10 text-center">
      <span className="sr-only">BandNoticeDetailPage</span>
      <p className="typo-base-r text-grey-100">공지 {noticeId}입니다</p>
    </div>
  );
}
