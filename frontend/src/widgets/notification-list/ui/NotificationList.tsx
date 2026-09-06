import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNotificationList } from '@/entities/notification/api/useNotificationList';
import { useMarkNotificationAsRead } from '@/entities/notification/api/useMarkNotificationAsRead';
import { useMarkAllNotificationsAsRead } from '@/entities/notification/api/useMarkAllNotificationsAsRead';
import { useDeleteManyNotifications } from '@/entities/notification/api/useDeleteManyNotifications';
import {
  useNotificationUnreadSummary,
  notificationQueries,
} from '@/entities/notification/api/useNotificationUnreadSummary';
import { updateNotificationHeader } from '@/entities/notification/model/notification-header-state';
import type { NotificationType } from '@/entities/notification/model/types';
import { resolveInviteId } from '@/entities/notification/lib/resolve-invite-id';
import { acceptInvite } from '@/features/invite-accept/api/invite-api';
import { declineInvite } from '@/features/invite-decline/api/invite-api';
import { bandKeys } from '@/entities/band/api/useBands';
import { cn } from '@/shared/lib/utils';
import { useShowOnScrollUp } from '@/shared/lib/use-scroll-direction';
import {
  slidingIndicatorClass,
  useSlidingIndicator,
} from '@/shared/lib/use-sliding-indicator';
import { NotificationCard } from './NotificationCard';

type TabType = 'NOTICE' | 'INVITE' | 'REMINDER';

const TAB_CONFIGS = [
  { key: 'NOTICE' as const, label: '공지사항' },
  { key: 'INVITE' as const, label: '초대장' },
  { key: 'REMINDER' as const, label: '일정 조율' },
] as const;

type NotificationListProps = {
  tab: TabType;
};

/**
 * 알림 탭바 + 목록 + 로딩/에러/빈 상태 + 더보기 버튼을 조합한 위젯.
 * 편집 모드 상태와 모든 mutation 로직을 캡슐화한다.
 */
export const NotificationList = ({ tab }: NotificationListProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 탭이 바뀌면 이전 탭의 선택을 버린다. 클릭 핸들러에만 두면 뒤로가기·앞으로가기·
  // URL 직접 이동이 그 경로를 타지 않아, 화면에 없는 알림이 선택된 채 삭제될 수 있다.
  const [renderedTab, setRenderedTab] = useState(tab);
  if (renderedTab !== tab) {
    setRenderedTab(tab);
    setIsEditMode(false);
    setSelectedIds(new Set());
  }

  const showTabBar = useShowOnScrollUp();
  const { containerRef: tabContainerRef, indicatorRef: tabIndicatorRef } =
    useSlidingIndicator(tab);

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
    referenceId?: string,
  ) => {
    if (type === 'INVITE') {
      const inviteId = resolveInviteId({
        reference: referenceId ? ({ id: referenceId } as never) : null,
        targetPath,
      });

      if (!inviteId) {
        toast.error('유효하지 않은 초대 ID입니다.');
        return;
      }

      try {
        const data = await acceptInvite(inviteId);
        toast.success('초대를 수락했습니다!');

        // 쿼리 캐시 갱신
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: notificationQueries.all }),
          queryClient.invalidateQueries({ queryKey: bandKeys.all }),
        ]);

        // 가입 완료된 밴드 상세 페이지로 리다이렉션
        navigate({ to: `/band/${data.bandId}` as never });
      } catch (error) {
        console.error('초대 수락 실패:', error);
        toast.error('초대 수락 중 오류가 발생했습니다.');
      }
      return;
    }

    // 읽음 처리는 부차적 side effect이므로 실패해도 이동은 막지 않는다.
    if (!isRead) {
      try {
        await markAsReadMutation.mutateAsync({ notificationId, type });
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error);
        toast.error('읽음 처리에 실패했어요. 잠시 후 다시 시도해주세요.');
      }
    }
    if (targetPath) {
      navigate({ to: targetPath as never });
    }
  };

  const handleNotificationDelete = async (
    notificationId: string,
    type: NotificationType,
    targetPath?: string,
    referenceId?: string,
  ) => {
    if (type === 'INVITE') {
      const inviteId = resolveInviteId({
        reference: referenceId ? ({ id: referenceId } as never) : null,
        targetPath,
      });

      if (!inviteId) {
        toast.error('유효하지 않은 초대 ID입니다.');
        return;
      }

      try {
        await declineInvite(inviteId);
        toast.success('초대를 거절했습니다.');

        // 거절 완료되면 해당 알림을 읽음 처리함
        await markAsReadMutation.mutateAsync({
          notificationId,
          type: 'INVITE',
        });
        await queryClient.invalidateQueries({
          queryKey: notificationQueries.all,
        });
      } catch (error) {
        console.error('초대 거절 실패:', error);
        toast.error('초대 거절 중 오류가 발생했습니다.');
      }
      return;
    }

    try {
      await deleteManyMutation.mutateAsync([notificationId]);
    } catch (error) {
      console.error('알림 삭제 실패:', error);
      toast.error('알림을 삭제하지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleMarkAllAsRead = () => {
    if (hasUnread) {
      markAllAsReadMutation.mutate(undefined, {
        onError: () => {
          toast.error('읽음 처리에 실패했어요. 잠시 후 다시 시도해주세요.');
        },
      });
    }
  };

  const deleteManyMutate = deleteManyMutation.mutateAsync;

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    try {
      await deleteManyMutate(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsEditMode(false);
    } catch (error) {
      console.error('알림 삭제 실패:', error);
      toast.error('알림을 삭제하지 못했어요. 잠시 후 다시 시도해주세요.');
    }
    // 의존성은 mutation 객체가 아니라 실제로 쓰는 mutateAsync 참조여야 한다
    // (객체를 넣으면 React Compiler가 수동 메모이제이션을 보존하지 못한다).
  }, [selectedIds, deleteManyMutate]);

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
        inert={!showTabBar}
        className={cn(
          'sticky top-[64px] z-30 -mx-5 -mt-8 px-5 pb-4',
          'transition-[transform,opacity] duration-300 ease-out',
          !showTabBar && '-translate-y-full opacity-0',
        )}
      >
        {/* 탭 네비게이션 */}
        <div className="pt-2 pb-0">
          <div
            ref={tabContainerRef}
            className="relative flex w-full gap-4 px-5"
          >
            <span
              ref={tabIndicatorRef}
              aria-hidden="true"
              className={cn(
                slidingIndicatorClass,
                'rounded-[20px] bg-primary shadow-sm',
              )}
            />
            {TAB_CONFIGS.map(({ key, label }) => {
              const isActive = tab === key;
              const hasUnreadForTab =
                unreadSummary?.unreadByType?.[key] != null &&
                unreadSummary.unreadByType[key] > 0;
              return (
                <button
                  key={key}
                  type="button"
                  data-active={isActive}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() =>
                    navigate({ to: '/notifications', search: { tab: key } })
                  }
                  className={`relative z-10 flex h-8.5 flex-1 items-center justify-center gap-1.5 rounded-[20px] typo-base-b transition-colors duration-200 ${
                    isActive ? 'text-grey-600' : 'text-primary'
                  }`}
                >
                  {label}
                  {hasUnreadForTab && (
                    <span className="absolute top-2 right-4 h-[5px] w-[5px] shrink-0 rounded-full bg-[#D6705C]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {!isLoading && !isError && hasNotifications && !isEditMode && (
          <div className="mt-2 flex items-center justify-end px-5">
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending || !hasUnread}
              className="rounded-full border border-grey-300 px-4 py-1.5 typo-xs-sb text-grey-300 transition-all hover:bg-grey-300 hover:text-black disabled:opacity-40"
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
          <p className="typo-base-sb text-red-500">
            알림 목록을 불러오지 못했습니다.
          </p>
          <p className="mt-2 typo-sm-r text-muted-foreground">
            잠시 후 다시 시도해 주세요.
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex h-[110px] w-full flex-col justify-center gap-1 rounded-2xl p-4">
          <h4 className="typo-sm-b text-primary">새로운 알림이 없습니다.</h4>
          <p className="typo-xs-sb text-grey-300">
            밴코 서비스의 모든 알림을 이곳에서 모아볼 수 있어요.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((noti) => (
            <NotificationCard
              key={noti.notificationId}
              noti={noti}
              isEditMode={isEditMode}
              isSelected={selectedIds.has(noti.notificationId)}
              onToggleSelect={handleToggleSelect}
              onAction={handleNotificationAction}
              onDelete={(id) =>
                handleNotificationDelete(
                  id,
                  noti.type,
                  noti.targetPath,
                  noti.reference?.id,
                )
              }
              onMarkAsRead={(id) =>
                markAsReadMutation.mutate(
                  {
                    notificationId: id,
                    type: noti.type,
                  },
                  {
                    onError: () => {
                      toast.error(
                        '읽음 처리에 실패했어요. 잠시 후 다시 시도해주세요.',
                      );
                    },
                  },
                )
              }
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
            className="flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-border py-2.5 typo-sm-sb text-foreground disabled:opacity-40"
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
