import { Search, Bell, Settings } from 'lucide-react';
import { BandList } from '@/widgets/band-list/ui/BandList';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useNotificationUnreadBadge } from '@/entities/notification/api/useNotificationUnreadSummary';

// 내 밴드 전용 우측 다중 아이콘 액션 버튼 컴포넌트
function MyBandsHeaderActions() {
  const { data: badge } = useNotificationUnreadBadge();
  const showBadge = badge && badge.count > 0;
  const badgeText = badge?.hasMore ? '9+' : String(badge?.count);

  return (
    <div className="flex items-center gap-4.5 text-grey-100">
      <Link
        to="/search"
        className="rounded-full transition-colors"
        aria-label="검색"
      >
        <Search className="size-6" />
      </Link>
      <Link
        to="/notifications"
        search={{ tab: 'INVITE' }}
        className="relative rounded-full p-1 transition-colors"
        aria-label="알림"
      >
        <Bell className="size-6" />
        {showBadge && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none font-bold text-white">
            {badgeText}
          </span>
        )}
      </Link>
      <Link
        to="/profile"
        className="rounded-full transition-colors"
        aria-label="마이 페이지"
      >
        <Settings className="size-6" />
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
