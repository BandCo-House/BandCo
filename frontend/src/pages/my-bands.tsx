import { Search, Bell, Plus } from 'lucide-react';
import { BandList } from '@/widgets/band-list/ui/BandList';
import { createFileRoute } from '@tanstack/react-router';

// 내 밴드 전용 우측 다중 아이콘 액션 버튼 컴포넌트
function MyBandsHeaderActions() {
  return (
    <div className="flex items-center gap-3 pr-2">
      <button 
        onClick={() => alert('검색 페이지 혹은 레이어 열기')} 
        className="p-1.5 text-foreground hover:bg-overlay-24 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-key"
        aria-label="검색"
      >
        <Search className="size-6" />
      </button>
      <button 
        onClick={() => alert('알림 페이지 혹은 레이어 열기')} 
        className="relative p-1.5 text-foreground hover:bg-overlay-24 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-key"
        aria-label="알림"
      >
        <Bell className="size-6" />
        <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full" />
      </button>
      <button 
        onClick={() => alert('밴드 생성 모달 열기')} 
        className="p-1.5 text-foreground hover:bg-overlay-24 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-key"
        aria-label="밴드 추가"
      >
        <Plus className="size-6" />
      </button>
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
