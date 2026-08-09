import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { NotificationList } from '@/widgets/notification-list/ui/NotificationList';
import { NotificationHeaderActions } from '@/widgets/notification-list/ui/NotificationHeaderActions';

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
      bottomBlur: false, // 알림은 헤더 글로우 제외(마이페이지·밴드 메인과 함께 커스텀 영역)
    },
  },
});

function NotificationsPage() {
  const { tab } = Route.useSearch();
  return <NotificationList key={tab} tab={tab} />;
}
