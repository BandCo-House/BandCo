import { createFileRoute } from '@tanstack/react-router';
import { requireAdmin } from '@/app/router-guards';

export const Route = createFileRoute('/admin')({
  beforeLoad: requireAdmin,
  component: AdminRoutePage,
  staticData: {
    header: {
      title: '관리자',
    },
  },
});

// 관리자 라우트 전용 화면
function AdminRoutePage() {
  return <div>AdminPage</div>;
}
