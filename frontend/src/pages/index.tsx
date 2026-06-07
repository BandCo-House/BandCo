import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: MyBandsRoutePage,
  staticData: {
    header: {
      title: 'BandCo',
      showBack: false,
    },
  },
});

// 홈 라우트 전용 화면
function MyBandsRoutePage() {
  return <div data-testid="home-page">홈 화면 구현 예정</div>;
}
