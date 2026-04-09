import { BandList } from '@/widgets/band-list/ui/BandList';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: MyBandsRoutePage,
  staticData: {
    header: {
      title: 'BandCo',
      showBack: false,
      showSearchBar: true,
      showNotificationTrigger: true,
    },
  },
});

// 홈(내 밴드 목록) 라우트 전용 화면
function MyBandsRoutePage() {
  return (
    <div data-testid="my-bands-page">
      <BandList />
    </div>
  );
}
