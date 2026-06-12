import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Loader2, Mail } from 'lucide-react';
import { useNotificationList } from '@/entities/notification/api/useNotificationList';
import { useMarkNotificationAsRead } from '@/entities/notification/api/useMarkNotificationAsRead';
import { useMarkAllNotificationsAsRead } from '@/entities/notification/api/useMarkAllNotificationsAsRead';
import { useDeleteManyNotifications } from '@/entities/notification/api/useDeleteManyNotifications';
import { useNotificationUnreadSummary } from '@/entities/notification/api/useNotificationUnreadSummary';
import { updateNotificationHeader } from '@/entities/notification/model/notification-header-state';
import type { NotificationType } from '@/entities/notification/model/types';
import { NotificationCard } from './NotificationCard';

type TabType = 'NOTICE' | 'INVITE' | 'REMINDER';

const TAB_CONFIGS = [
  { key: 'NOTICE' as const, label: '공지사항' },
  { key: 'INVITE' as const, label: '초대장' },
  { key: 'REMINDER' as const, label: '일정조율' },
] as const;

type NotificationListProps = {
  tab: TabType;
};

/**
 * 알림 탭바 + 목록 + 로딩/에러/빈 상태 + 더보기 버튼을 조합한 위젯.
 * 편집 모드 상태와 모든 mutation 로직을 캡슐화한다.
 * 탭 변경 시 key prop 패턴으로 편집 상태를 자동 초기화한다.
 */
export const NotificationList = ({ tab }: NotificationListProps) => {
  const navigate = useNavigate();

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useNotificationList({ where__type: tab });

  const { data: unreadSummary } = useNotificationUnreadSummary();

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteManyMutation = useDeleteManyNotifications();

  const notifications = data?.pages.flatMap((page) => page.items) ?? [];
  const hasNotifications = notifications.length > 0;
  const hasUnread = notifications.some((n) => !n.isRead);

  const handleToggleSelect = (notificationId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(notificationId)) {
        next.delete(notificationId);
      } else {
        next.add(notificationId);
      }
      return next;
    });
  };

  const handleNotificationAction = async (
    notificationId: string,
    type: NotificationType,
    targetPath?: string,
    isRead?: boolean,
  ) => {
    if (!isRead) {
      await markAsReadMutation.mutateAsync({ notificationId, type });
    }
    if (targetPath) {
      navigate({ to: targetPath as never });
    }
  };

  const handleMarkAllAsRead = () => {
    if (hasUnread) {
      markAllAsReadMutation.mutate();
    }
  };

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    try {
      await deleteManyMutation.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsEditMode(false);
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    }
  }, [selectedIds, deleteManyMutation]);

  const handleCancelEdit = useCallback(() => {
    setSelectedIds(new Set());
    setIsEditMode(false);
  }, []);

  // 헤더 펍섭 상태 바인딩
  useEffect(() => {
    updateNotificationHeader({
      isEditMode,
      selectedIds,
      isDeletePending: deleteManyMutation.isPending,
      hasNotifications,
      onDeleteSelected: handleDeleteSelected,
      onCancelEdit: handleCancelEdit,
      onStartEdit: () => setIsEditMode(true),
    });
  }, [
    isEditMode,
    selectedIds,
    deleteManyMutation.isPending,
    hasNotifications,
    handleDeleteSelected,
    handleCancelEdit,
  ]);

  // 언마운트 시 헤더 상태 클린업
  useEffect(() => {
    return () => {
      updateNotificationHeader({
        isEditMode: false,
        selectedIds: new Set(),
        isDeletePending: false,
        hasNotifications: false,
        onDeleteSelected: undefined,
        onCancelEdit: undefined,
        onStartEdit: undefined,
      });
    };
  }, []);

  return (
    <div data-testid="notifications-page" className="w-full pb-16">
      {/* 통합 sticky 헤더 (탭 바 + 요약/모두읽음 바) */}
      <div
        className="sticky top-[64px] z-30 -mx-5 -mt-8 px-5"
        style={{
          background:
            'linear-gradient(135deg, var(--gradient-top) 0%, var(--gradient-bottom) 100%)',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* 탭 네비게이션 */}
        <div className="pt-2 pb-0">
          <div className="flex w-full gap-4 px-0">
            {TAB_CONFIGS.map(({ key, label }) => {
              const isActive = tab === key;
              const hasUnreadForTab =
                unreadSummary?.unreadByType?.[key] != null &&
                unreadSummary.unreadByType[key] > 0;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    navigate({ to: '/notifications', search: { tab: key } })
                  }
                  className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 typo-sm-sb transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-secondary-surface shadow-sm'
                      : 'bg-transparent text-grey-100 hover:text-white'
                  }`}
                >
                  {label}
                  {!isActive && hasUnreadForTab && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 모두 읽음 버튼 바 */}
        {!isLoading && !isError && hasNotifications && !isEditMode && (
          <div className="mt-0 flex items-center justify-end py-2">
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending || !hasUnread}
              className="typo-xs-m text-grey-300 disabled:opacity-40"
            >
              모두 읽음
            </button>
          </div>
        )}
      </div>

      {/* 콘텐츠 영역 */}
      {isLoading ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 py-20 text-center">
          <Loader2 className="text-grey-30 h-8 w-8 animate-spin" />
          <p className="typo-base-r text-muted-foreground">
            알림을 불러오는 중입니다...
          </p>
        </div>
      ) : isError ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center py-20 text-center">
          <p className="typo-base-m text-red-500">
            알림 목록을 불러오지 못했습니다.
          </p>
          <p className="mt-2 typo-sm-r text-muted-foreground">
            잠시 후 다시 시도해 주세요.
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-grey-40 flex min-h-[300px] flex-col items-center justify-center py-20 text-center">
          <Mail className="mb-4 h-12 w-12 opacity-30" />
          <p className="typo-base-r">도착한 알림이 없습니다.</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {notifications.map((noti) => (
            <NotificationCard
              key={noti.notificationId}
              noti={noti}
              isEditMode={isEditMode}
              isSelected={selectedIds.has(noti.notificationId)}
              onToggleSelect={handleToggleSelect}
              onAction={handleNotificationAction}
            />
          ))}
        </div>
      )}

      {/* 더 보기 페이징 버튼 */}
      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-border py-2.5 typo-sm-m text-foreground disabled:opacity-40"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                불러오는 중...
              </>
            ) : (
              '알림 더 보기'
            )}
          </button>
        </div>
      )}
    </div>
  );
};
