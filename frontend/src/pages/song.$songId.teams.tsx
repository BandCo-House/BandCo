import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/song/$songId/teams')({
  component: SongTeamsRoutePage,
  staticData: {
    header: {
      title: '팀 목록',
    },
  },
});

// 곡별 팀 목록 라우트 전용 화면
function SongTeamsRoutePage() {
  return <div>SongTeamsPage</div>;
}
