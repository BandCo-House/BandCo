import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/performance/create')({
  component: PerformanceCreateRoutePage,
  staticData: {
    header: {
      title: '공연 생성',
    },
  },
});

// 공연 생성 라우트 전용 화면
function PerformanceCreateRoutePage() {
  return <div>PerformanceCreatePage</div>;
}
