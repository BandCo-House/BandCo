import { NotificationBellLink } from '@/entities/notification/ui/NotificationBellLink';

/** 홈 헤더 우측 액션(알림). 마이 페이지는 하단 네비로 진입한다. */
export const HomeHeaderActions = () => (
  <div className="flex items-center gap-4.5">
    <NotificationBellLink />
  </div>
);
