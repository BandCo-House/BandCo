import { Link } from '@tanstack/react-router';
import SettingIcon from '@/assets/icons/setting.svg?react';
import { NotificationBellLink } from '@/entities/notification/ui/NotificationBellLink';

/** 홈 헤더 우측 액션(알림·설정). */
export const HomeHeaderActions = () => (
  <div className="flex items-center gap-4.5">
    <NotificationBellLink />
    <Link
      to="/profile"
      aria-label="마이 페이지"
      className="inline-flex size-9 items-center justify-center rounded-lg text-grey-100 focus-visible:outline-2 focus-visible:outline-primary"
    >
      <SettingIcon aria-hidden="true" className="size-5" />
    </Link>
  </div>
);
