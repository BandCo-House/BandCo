import { Search } from 'lucide-react';
import { BandList } from '@/widgets/band-list/ui/BandList';
import { createFileRoute, Link } from '@tanstack/react-router';
import { NotificationBellLink } from '@/entities/notification/ui/NotificationBellLink';

// 내 밴드 전용 우측 다중 아이콘 액션 버튼. 알림 벨은 홈과 같은 공용 컴포넌트를 쓴다.
function MyBandsHeaderActions() {
  return (
    <div className="flex items-center gap-4.5">
      <Link
        to="/search"
        aria-label="검색"
        className="inline-flex size-9 items-center justify-center rounded-lg text-grey-100 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Search aria-hidden="true" className="size-6" />
      </Link>
      <NotificationBellLink />
      {/* TODO: 밴드 리스트 수정 작업 때 다시 도입한다. 그때까지는 노출하지 않는다.
      <Link
        to="/profile"
        aria-label="마이 페이지"
        className="inline-flex size-9 items-center justify-center rounded-lg text-grey-100 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <SettingIcon aria-hidden="true" className="size-5" />
      </Link>
      */}
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
