import { Search, Bell, Plus } from 'lucide-react';
import { BandList } from '@/widgets/band-list/ui/BandList';
import { createFileRoute, Link } from '@tanstack/react-router';

// 내 밴드 전용 우측 다중 아이콘 액션 버튼 컴포넌트
function MyBandsHeaderActions() {
  return (
    <div className="flex items-center gap-3 text-grey-100">
      <Link
        to="/search"
        className="rounded-full p-1.5 transition-colors hover:bg-overlay-24 focus-visible:outline-2 focus-visible:outline-key"
        aria-label="검색"
      >
        <Search className="size-6" />
      </Link>
      <Link
        to="/notifications"
        className="relative rounded-full p-1.5 transition-colors hover:bg-overlay-24 focus-visible:outline-2 focus-visible:outline-key"
        aria-label="알림"
      >
        <Bell className="size-6" />
      </Link>
      <Link
        to="/profile"
        className="rounded-full p-1.5 transition-colors hover:bg-overlay-24 focus-visible:outline-2 focus-visible:outline-key"
        aria-label="설정"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  );
}

export const Route = createFileRoute('/my-bands')({
  component: MyBandsPage,
  staticData: {
    header: {
      title: '내 밴드',
      titleSize: 'lg',
      showBack: false,
      heightVariant: 'lg', // 64px 기본 높이
      renderRight: () => <MyBandsHeaderActions />,
    },
  },
});

function MyBandsPage() {
  return (
    <div data-testid="my-bands-route-page">
      <BandList />
    </div>
  );
}
