import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/my-bands')({
  component: MyBandsPage,
  staticData: {
    header: {
      title: '내 밴드',
      showBack: false,
    },
  },
});

function MyBandsPage() {
  return (
    <div data-testid="my-bands-route-page" className="flex items-center justify-center py-20">
      <p className="text-muted-foreground typo-base-r">내 밴드 목록 준비 중입니다.</p>
    </div>
  );
}
