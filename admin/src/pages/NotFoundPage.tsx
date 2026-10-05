import { Link } from '@tanstack/react-router';

import { EmptyState } from '@/shared/ui/EmptyState';

export const NotFoundPage = () => (
  <EmptyState
    title="페이지를 찾을 수 없습니다."
    action={
      <Link to="/" className="mt-2 text-sm text-sky-700 hover:underline">
        대시보드로 이동
      </Link>
    }
  />
);
