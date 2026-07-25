import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
  staticData: {
    header: {
      title: '알림',
      showBack: true, // 알림 페이지에서는 뒤로 가기가 가능하도록 설정
      heightVariant: 'lg',
      bottomBlur: false, // 알림은 헤더 글로우 제외(마이페이지·밴드 메인과 함께 커스텀 영역)
    },
  },
});

function NotificationsPage() {
  return (
    <div
      data-testid="notifications-page"
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <p className="typo-base-r text-muted-foreground">
        알림 페이지 구현 예정입니다.
      </p>
    </div>
  );
}
