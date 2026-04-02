import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { NotificationType } from '@/entities/notification/model/types';
import { useMarkAllNotificationsAsRead } from '@/entities/notification/api/useMarkAllNotificationsAsRead';
import { useMarkNotificationAsRead } from '@/entities/notification/api/useMarkNotificationAsRead';
import { Button } from '@/shared/ui/button';
import { SVGIcon } from '@/shared/ui/icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { cn } from '@/shared/lib/utils';
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import {
  buildUnreadByTypeFromNotifications,
  getUnreadNotificationsCount,
  type NotificationPreview,
  markNotificationPreviewAsRead,
  notificationTypeFilters,
  translateNotificationType,
} from './notification.data';
import { notificationPreviewsMock } from './notification.data.mock';

const getNotificationTextClassName = (
  tone: 'title' | 'description',
  isRead: boolean,
) =>
  tone === 'title'
    ? `typo-sm-b ${isRead ? 'text-muted' : 'text-foreground'}`
    : `typo-sm-r ${isRead ? 'text-muted' : 'text-foreground'}`;

/**
 * 홈 헤더 알림 버튼에서 열리는 우측 시트 패널
 */
export const NotificationSheet = ({
  notifications: incomingNotifications,
}: {
  notifications?: NotificationPreview[];
}) => {
  const [activeType, setActiveType] = useState<NotificationType>('INVITE');
  const [notifications, setNotifications] = useState<NotificationPreview[]>([]);
  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } =
    useMarkAllNotificationsAsRead();
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const fallbackNotifications = import.meta.env.PROD
    ? []
    : notificationPreviewsMock;

  useEffect(() => {
    setNotifications(incomingNotifications ?? fallbackNotifications);
  }, [fallbackNotifications, incomingNotifications]);

  const visibleNotifications = notifications.filter(
    (notification) => notification.type === activeType,
  );
  const resolvedUnreadByType = buildUnreadByTypeFromNotifications(notifications);
  const unreadCount = getUnreadNotificationsCount(notifications);

  /**
   * 카드 액션에서 개별 알림을 읽음 처리합니다.
   */
  const handleMarkAsRead = (notificationId: string, type: NotificationType) => {
    const previousNotifications = notifications;

    setNotifications((currentNotifications) =>
      markNotificationPreviewAsRead(currentNotifications, notificationId),
    );

    markAsRead(
      { notificationId, type },
      {
        onError: () => {
          setNotifications(previousNotifications);
        },
      },
    );
  };

  /**
   * 현재 시트에 표시 중인 알림 전체를 읽음 상태로 변경합니다.
   */
  const handleMarkAllAsRead = () => {
    const previousNotifications = notifications;

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        isRead:
          notification.type === activeType ? true : notification.isRead,
      })),
    );

    markAllAsRead(undefined, {
      onError: () => {
        setNotifications(previousNotifications);
      },
    });
  };

  return (
    <SheetContent
      showCloseButton={false}
      className="w-full rounded-none border-l border-border bg-card px-4 py-5 backdrop-blur-xl sm:max-w-sm sm:px-5"
    >
      <SheetHeader className="gap-0 p-0">
        <div className="flex items-center justify-between">
          <SheetTitle className="typo-xl-sb">
            알림
          </SheetTitle>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={unreadCount === 0 || isMarkingAllAsRead}
            className="h-auto px-0 text-muted hover:bg-transparent hover:text-foreground"
            onClick={handleMarkAllAsRead}
          >
            <span className="typo-sm-m">모두 읽음</span>
          </Button>
        </div>

        <SheetDescription className="sr-only">
          최근 공지, 초대장, 일정 알림을 확인할 수 있는 패널
        </SheetDescription>
      </SheetHeader>

      <nav aria-label="알림 분류" className="mt-0 flex items-center gap-2">
        {notificationTypeFilters.map((type) => {
          const hasUnread = resolvedUnreadByType[type] > 0;
          const isActive = type === activeType;

          return (
            <Button
              key={type}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'relative px-4',
                isActive
                  ? 'bg-foreground text-background hover:bg-foreground'
                  : 'bg-input text-muted hover:bg-input hover:text-foreground',
              )}
              onClick={() => setActiveType(type)}
            >
              <span className="typo-sm-sb">{translateNotificationType(type)}</span>
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

      <ul aria-label="알림 목록" className="mt-2 space-y-3">
        {visibleNotifications.map((notification) => (
          <li key={notification.notificationId} className="relative">
            {(() => {
              const actions = [
                {
                  key: 'mark-as-read',
                  label: '읽음으로 표시',
                  disabled: notification.isRead,
                  onClick: () =>
                    handleMarkAsRead(
                      notification.notificationId,
                      notification.type,
                    ),
                },
              ];
              const hasEnabledActions = actions.some((action) => !action.disabled);
              const cardContent = (
                <>
                  <div className="min-w-0 space-y-1">
                    <h3 className={getNotificationTextClassName('title', notification.isRead)}>
                      {notification.title}
                    </h3>
                    <p className={getNotificationTextClassName('description', notification.isRead)}>
                      {notification.description}
                    </p>
                  </div>
                </>
              );

              return (
                <>
                  {notification.targetPath ? (
                    <Link
                      to={notification.targetPath as never}
                      className="block rounded-lg border border-border bg-card px-4 py-4 pr-12 shadow-xl/5 transition-colors hover:bg-background/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {cardContent}
                    </Link>
                  ) : (
                    <article className="rounded-lg border border-border bg-card px-4 py-4 pr-12 shadow-xl/5">
                      {cardContent}
                    </article>
                  )}

                  {hasEnabledActions ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`${notification.title} 더보기`}
                          className="absolute top-3 right-1 size-8 shrink-0 rounded-full text-muted hover:bg-background hover:text-foreground"
                        >
                          <SVGIcon icon="Kebab" size="sm" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        sideOffset={2}
                        className="w-40 bg-popover p-1"
                      >
                        {actions.map((action) => (
                          <Button
                            key={action.key}
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={action.disabled}
                            className="w-full justify-start rounded-xl px-3 text-foreground"
                            onClick={action.onClick}
                          >
                            <span className="typo-sm-m">{action.label}</span>
                          </Button>
                        ))}
                      </PopoverContent>
                    </Popover>
                  ) : null}
                </>
              );
            })()}
          </li>
        ))}
      </ul>
    </SheetContent>
  );
};
