import { Link } from '@tanstack/react-router';
import BellIcon from '@/assets/icons/bell.svg?react';
import { cn } from '@/shared/lib/utils';
import { useNotificationUnreadSummary } from '../api/useNotificationUnreadSummary';

/**
 * 헤더 공용 알림 벨. 안 읽은 알림 전체 개수를 배지로 붙인다.
 * 개수는 GET /notifications/unread-summary의 unreadCount에서 온다.
 */
export const NotificationBellLink = ({ className }: { className?: string }) => {
  const { data: summary } = useNotificationUnreadSummary();
  const count = summary?.unreadCount ?? 0;
  const overflow = count > 9;
  const badgeText = overflow ? '9+' : String(count);
  const badgeLabel = overflow ? '알림 9건 이상' : `알림 ${count}건`;

  return (
    <Link
      to="/notifications"
      search={{ tab: 'INVITE' }}
      aria-label={count > 0 ? badgeLabel : '알림'}
      className={cn(
        'relative inline-flex size-9 items-center justify-center rounded-lg text-grey-100 focus-visible:outline-2 focus-visible:outline-primary',
        className,
      )}
    >
      <BellIcon aria-hidden="true" className="size-6" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 inline-flex min-w-5 items-center justify-center rounded-md bg-primary px-1 typo-xs-m text-secondary"
        >
          {badgeText}
        </span>
      )}
    </Link>
  );
};
