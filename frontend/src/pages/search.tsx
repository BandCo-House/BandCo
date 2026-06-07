import { createFileRoute } from '@tanstack/react-router';

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
    <div data-testid="search-page" className="flex items-center justify-center py-20">
      <p className="text-muted-foreground typo-base-r">검색 기능 준비 중입니다.</p>
    </div>
  );
}
