import { createFileRoute } from '@tanstack/react-router';
import { requireLogin } from '@/app/router-guards';

export const Route = createFileRoute('/profile')({
  beforeLoad: requireLogin,
  component: ProfileRoutePage,
  staticData: {
    header: {
      title: '마이페이지',
      subtitle: '내 프로필 정보를 관리하세요',
      rightActionLabel: '수정',
      backBehavior: 'browser',
      showProfileAvatar: false,
    },
  },
});

// 프로필 라우트 전용 화면
function ProfileRoutePage() {
  return <div>ProfilePage</div>;
}
