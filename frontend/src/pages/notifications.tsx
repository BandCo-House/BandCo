import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { NotificationList } from '@/widgets/notification-list/ui/NotificationList';
import { NotificationHeaderActions } from '@/widgets/notification-list/ui/NotificationHeaderActions';
import { NotificationHeaderTitle } from '@/widgets/notification-list/ui/NotificationHeaderTitle';
import { NotificationTabs } from '@/widgets/notification-list/ui/NotificationTabs';

const notificationsSearchSchema = z.object({
  tab: z.enum(['NOTICE', 'INVITE', 'REMINDER']).catch('NOTICE'),
});

export const Route = createFileRoute('/notifications')({
  validateSearch: (search) => notificationsSearchSchema.parse(search),
  component: NotificationsPage,
  staticData: {
    header: {
      // 편집 모드에서 '2개 선택'으로 바뀐다(선택 개수를 오른쪽에서 중복해 말하지 않기 위해).
      title: () => <NotificationHeaderTitle />,
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
