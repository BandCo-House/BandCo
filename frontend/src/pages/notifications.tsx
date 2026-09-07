import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { NotificationList } from '@/widgets/notification-list/ui/NotificationList';
import { NotificationHeaderActions } from '@/widgets/notification-list/ui/NotificationHeaderActions';
import { NotificationTabs } from '@/widgets/notification-list/ui/NotificationTabs';

const notificationsSearchSchema = z.object({
  tab: z.enum(['NOTICE', 'INVITE', 'REMINDER']).catch('NOTICE'),
});

export const Route = createFileRoute('/notifications')({
  validateSearch: (search) => notificationsSearchSchema.parse(search),
  component: NotificationsPage,
  staticData: {
    header: {
      title: '알림',
      showBack: true,
      heightVariant: 'lg',
      renderRight: () => <NotificationHeaderActions />,
      // 밴드 메인 탭과 같은 자리(헤더 하단)에 둔다. 페이지 본문에서 sticky로
      // 띄우면 헤더와 따로 놀고, 스크롤에 따라 사라져 탭 위치가 불안정하다.
      renderBottom: () => <NotificationTabs />,
      bottomBlur: true,
    },
  },
});

function NotificationsPage() {
  const { tab } = Route.useSearch();
  return <NotificationList tab={tab} />;
}
