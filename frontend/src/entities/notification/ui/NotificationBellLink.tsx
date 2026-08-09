import { Link } from '@tanstack/react-router';
import BellIcon from '@/assets/icons/bell.svg?react';
import { cn } from '@/shared/lib/utils';
import { useNotificationUnreadBadge } from '../api/useNotificationUnreadSummary';

/**
 * 헤더 공용 알림 벨. 안 읽은 초대 개수를 배지로 붙인다.
 * unread-summary는 백엔드 미구현이라 INVITE 미읽음 카운트를 쓴다.
 */
export const NotificationBellLink = ({ className }: { className?: string }) => {
  const { data: badge } = useNotificationUnreadBadge();
  const count = badge?.count ?? 0;
  const badgeText = badge?.hasMore ? '9+' : String(count);

  return (
    <Link
      to="/notifications"
      search={{ tab: 'INVITE' }}
      aria-label={count > 0 ? `알림 ${badgeText}건` : '알림'}
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
