import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/song/$songId/team/$teamId')({
  component: TeamDetailRoutePage,
  staticData: {
    header: {
      title: '팀 상세',
      backTo: '/song/$songId/teams',
      getBackParams: (params: Record<string, string>) => ({
        songId: params.songId,
      }),
    },
  },
});

// 팀 상세 라우트 전용 화면
function TeamDetailRoutePage() {
  return <div>TeamDetailPage</div>;
}
