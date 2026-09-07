import { useSearch } from '@tanstack/react-router';
import { useNotificationUnreadSummary } from '@/entities/notification/api/useNotificationUnreadSummary';
import { RouteTabs } from '@/widgets/page-header';

export const NOTIFICATION_TABS = [
  { key: 'NOTICE' as const, label: '공지사항' },
  { key: 'INVITE' as const, label: '초대장' },
  { key: 'REMINDER' as const, label: '일정 조율' },
] as const;

/**
 * 알림 탭. 밴드 메인 탭과 같은 RouteTabs를 쓰고 variant만 pill로 바꾼다.
 * pages/notifications.tsx의 header.renderBottom에서 렌더링돼 헤더 안에 들어간다.
 */
export const NotificationTabs = () => {
  const { tab } = useSearch({ from: '/notifications' });
  const { data: unreadSummary } = useNotificationUnreadSummary();

  return (
    <RouteTabs
      ariaLabel="알림 탭"
      variant="pill"
      // 탭이 같은 라우트의 검색 파라미터라 push하면 뒤로가기가
      // 알림 페이지를 벗어나지 못한다. 알림은 여러 화면에서 들어오므로
      // 뒤로가기는 "들어온 화면"으로 돌아가야 한다.
      replaceOnChange
      activeKey={tab}
      tabs={NOTIFICATION_TABS.map(({ key, label }) => ({
        key,
        label,
        to: '/notifications',
        search: { tab: key },
        showDot: (unreadSummary?.unreadByType?.[key] ?? 0) > 0,
      }))}
    />
  );
};
