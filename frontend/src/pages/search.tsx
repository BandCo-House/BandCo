import { createFileRoute } from '@tanstack/react-router';
import { ComingSoon } from '@/shared/ui/coming-soon';

export const Route = createFileRoute('/search')({
  component: SearchPage,
  staticData: {
    header: {
      title: '검색',
      showBack: false,
    },
  },
});

function SearchPage() {
  return (
    <ComingSoon
      data-testid="search-page"
      message="검색 기능을 준비 중입니다."
    />
  );
}
