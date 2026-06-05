import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useNotificationList } from '@/entities/notification/api/useNotificationList';
import { useMarkNotificationAsRead } from '@/entities/notification/api/useMarkNotificationAsRead';
import { useMarkAllNotificationsAsRead } from '@/entities/notification/api/useMarkAllNotificationsAsRead';
import { useDeleteManyNotifications } from '@/entities/notification/api/useDeleteManyNotifications';
import { Mail, Megaphone, Clock, CheckCheck, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';

export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
  staticData: {
    header: {
      title: '알림',
      showBack: true,
      heightVariant: 'lg',
    },
  },
});

// 간단한 시간 흐름 계산 헬퍼 함수
function formatTimeAgo(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${diffDays}일 전`;
}

function NotificationsPage() {
  const navigate = useNavigate();

  // 1. 상태 관리: 편집 모드 및 선택된 알림 ID 목록
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 2. 알림 목록 무한 스크롤 조회
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useNotificationList();

  // 3. 알림 관련 뮤테이션 훅 호출
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteManyMutation = useDeleteManyNotifications();

  // 알림 목록 통합 전개
  const notifications = data?.pages.flatMap((page) => page.items) ?? [];

  // 선택 상태 토글 헬퍼
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

  // 특정 알림 액션 처리 함수 (이동 및 단건 읽음)
  const handleNotificationAction = async (
    notificationId: string,
    type: 'INVITE' | 'NOTICE' | 'REMINDER',
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

  // 전체 읽음 처리 액션
  const handleMarkAllAsRead = () => {
    if (notifications.some((n) => !n.isRead)) {
      markAllAsReadMutation.mutate();
    }
  };

  // 선택된 다중 알림 삭제 처리 액션
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      await deleteManyMutation.mutateAsync(Array.from(selectedIds));
      // 삭제 후 편집 모드 해제 및 상태 리셋
      setSelectedIds(new Set());
      setIsEditMode(false);
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    }
  };

  // 편집 모드 취소 액션
  const handleCancelEdit = () => {
    setSelectedIds(new Set());
    setIsEditMode(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-grey-30" />
        <p className="text-muted-foreground typo-base-r">알림을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center py-20 text-center">
        <p className="text-red-500 typo-base-m">알림 목록을 불러오지 못했습니다.</p>
        <p className="mt-2 text-muted-foreground typo-sm-r">잠시 후 다시 시도해 주세요.</p>
      </div>
    );
  }

  return (
    <div data-testid="notifications-page" className="mx-auto w-full max-w-xl pb-16">
      {/* 동적 제어형 로컬 헤더 영역 */}
      <div className="flex items-center justify-between border-b border-grey-10 pb-4">
        {isEditMode ? (
          <>
            <h2 className="text-red-500 font-bold typo-base-m">
              {selectedIds.size}개 선택됨
            </h2>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0 || deleteManyMutation.isPending}
                className="h-8 rounded-lg text-xs font-semibold px-3 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                {selectedIds.size}개 삭제하기
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="h-8 rounded-lg text-xs font-medium text-grey-50 hover:bg-grey-5"
              >
                취소
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-grey-100 typo-lg-b">새로운 알림</h2>
            {notifications.length > 0 && (
              <div className="flex items-center gap-1">
                {/* 모두 읽음 버튼 */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending || !notifications.some((n) => !n.isRead)}
                  className="flex items-center gap-1 text-grey-50 hover:text-grey-100 transition-colors h-8"
                >
                  <CheckCheck className="h-4 w-4" />
                  모두 읽음
                </Button>
                {/* 편집 모드 스위치 (휴지통) */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center justify-center text-grey-50 hover:text-red-500 hover:bg-red-50/50 transition-colors h-8 w-8 p-0 rounded-lg"
                  aria-label="편집 모드 활성화"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 알림 리스트 영역 */}
      {notifications.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center py-20 text-center text-grey-40">
          <Mail className="mb-4 h-12 w-12 opacity-30" />
          <p className="typo-base-r">도착한 알림이 없습니다.</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {notifications.map((noti) => {
            const typeConfig = {
              INVITE: {
                icon: Mail,
                iconClass: 'bg-blue-50 text-blue-500 border-blue-100',
                label: '초대',
              },
              NOTICE: {
                icon: Megaphone,
                iconClass: 'bg-emerald-50 text-emerald-500 border-emerald-100',
                label: '공지',
              },
              REMINDER: {
                icon: Clock,
                iconClass: 'bg-amber-50 text-amber-500 border-amber-100',
                label: '리마인더',
              },
            }[noti.type];

            const IconComponent = typeConfig.icon;
            const isSelected = selectedIds.has(noti.notificationId);

            return (
              <div
                key={noti.notificationId}
                onClick={
                  isEditMode
                    ? () => handleToggleSelect(noti.notificationId)
                    : noti.type !== 'INVITE'
                      ? () =>
                          handleNotificationAction(
                            noti.notificationId,
                            noti.type,
                            noti.targetPath,
                            noti.isRead,
                          )
                      : undefined
                }
                className={`group relative flex gap-4 rounded-xl border p-4.5 transition-all duration-200 ${
                  isEditMode || noti.type !== 'INVITE'
                    ? 'cursor-pointer hover:border-grey-30 hover:bg-grey-2/30 active:scale-[0.995]'
                    : ''
                } ${
                  !noti.isRead
                    ? 'border-grey-20 bg-grey-2/50'
                    : 'border-grey-10 bg-white opacity-85'
                }`}
              >
                {/* 1. 편집 모드 체크박스 표시 영역 */}
                {isEditMode && (
                  <div className="flex items-center justify-center shrink-0 pr-1">
                    <div
                      className={`flex h-5.5 w-5.5 items-center justify-center rounded-full border transition-all duration-200 ${
                        isSelected
                          ? 'bg-red-500 border-red-500 text-white'
                          : 'border-grey-30 bg-white hover:border-grey-50'
                      }`}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3 stroke-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. 타입별 아이콘 영역 */}
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-center ${typeConfig.iconClass}`}
                >
                  <IconComponent className="h-5 w-5" />
                </div>

                {/* 3. 알림 상세 텍스트 영역 */}
                <div className="flex flex-1 flex-col justify-center gap-1 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold tracking-wide uppercase opacity-75">
                      {typeConfig.label}
                    </span>
                    <span className="text-grey-40 text-[11px] typo-sm-r">
                      {formatTimeAgo(noti.createdAt)}
                    </span>
                  </div>
                  <h3
                    className={`typo-base-m ${
                      !noti.isRead ? 'text-grey-100 font-semibold' : 'text-grey-60'
                    }`}
                  >
                    {noti.title}
                  </h3>
                  <p className="text-grey-50 mt-0.5 typo-sm-r line-clamp-2 leading-relaxed">
                    {noti.description}
                  </p>

                  {/* INVITE 전용: 초대장 보기 액션 버튼 (편집 모드 아닐 때만 렌더링) */}
                  {noti.type === 'INVITE' && !isEditMode && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationAction(
                            noti.notificationId,
                            noti.type,
                            noti.targetPath,
                            noti.isRead,
                          );
                        }}
                        className="h-8.5 rounded-lg px-4.5 text-xs font-semibold"
                      >
                        초대장 보기
                      </Button>
                    </div>
                  )}
                </div>

                {/* 4. 읽지 않음 파란 점 (dot) 표시 (편집 모드가 아닐 때만 노출) */}
                {!noti.isRead && !isEditMode && (
                  <span className="absolute top-4.5 right-4.5 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 더 보기 페이징 버튼 영역 */}
      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full max-w-xs flex items-center justify-center gap-2"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-grey-40" />
                불러오는 중...
              </>
            ) : (
              '알림 더 보기'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
