import { useState } from 'react';
import type { NotificationType, NotificationUnreadByType } from '@/entities/notification/model/types';
import { Button } from '@/shared/ui/button';
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import {
  buildUnreadByTypeFromNotifications,
  notificationPreviews,
  notificationTypeFilters,
  translateNotificationType,
} from './notification.data';

/**
 * 홈 헤더 알림 버튼에서 열리는 우측 시트 패널
 */
export const NotificationSheet = ({
  unreadByType,
}: {
  unreadByType?: NotificationUnreadByType;
}) => {
  const [activeType, setActiveType] = useState<NotificationType>('INVITE');
  const visibleNotifications = notificationPreviews.filter(
    (notification) => notification.type === activeType,
  );
  const resolvedUnreadByType =
    unreadByType ?? buildUnreadByTypeFromNotifications(notificationPreviews);

  return (
    <SheetContent
      showCloseButton={false}
      className="w-full rounded-none border-l border-border bg-card px-4 py-5 backdrop-blur-xl sm:max-w-sm sm:px-5"
    >
      <SheetHeader className="gap-0 p-0">
        <div className="flex items-center justify-between gap-3">
          <SheetTitle className="text-2xl">
            알림
          </SheetTitle>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs-sb h-auto px-0 text-muted hover:bg-transparent hover:text-foreground"
          >
            모두 읽음
          </Button>
        </div>

        <SheetDescription className="sr-only">
          최근 공지, 초대장, 일정 알림을 확인할 수 있는 패널
        </SheetDescription>
      </SheetHeader>

      <nav aria-label="알림 분류" className="mt-4 flex items-center gap-2">
        {notificationTypeFilters.map((type) => {
          const hasUnread = resolvedUnreadByType[type] > 0;
          const isActive = type === activeType;

          return (
            <Button
              key={type}
              type="button"
              variant="ghost"
              size="sm"
              className={isActive
                ? 'text-sm-sb relative h-9 bg-foreground px-4 text-background hover:bg-foreground'
                : 'text-sm-sb relative h-9 bg-input px-4 text-muted hover:bg-input hover:text-foreground'}
              onClick={() => setActiveType(type)}
            >
              {translateNotificationType(type)}
              {hasUnread ? (
                <span
                  aria-hidden="true"
                  className="absolute top-2 right-2.5 size-1.5 rounded-full bg-accent"
                />
              ) : null}
            </Button>
          );
        })}
      </nav>

      <ul aria-label="알림 목록" className="mt-4 space-y-3">
        {visibleNotifications.map((notification) => (
          <li key={notification.notificationId}>
            <article className="rounded-2xl border border-border bg-card px-4 py-4 shadow-xl/5">
              <div className="space-y-1">
                <h3 className="text-lg-b text-foreground">
                  {notification.title}
                </h3>
                <p className="text-base-r text-muted">
                  {notification.description}
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </SheetContent>
  );
};
