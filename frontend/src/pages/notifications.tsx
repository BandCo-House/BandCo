import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useNotificationList } from '@/entities/notification/api/useNotificationList';
import { useMarkNotificationAsRead } from '@/entities/notification/api/useMarkNotificationAsRead';
import { useMarkAllNotificationsAsRead } from '@/entities/notification/api/useMarkAllNotificationsAsRead';
import { Mail, Megaphone, Clock, CheckCheck, Loader2 } from 'lucide-react';
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

  // 1. 알림 목록 무한 스크롤 조회 (Cursor 페이징)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useNotificationList();

  // 2. 단건 읽음 처리 뮤테이션
  const markAsReadMutation = useMarkNotificationAsRead();

  // 3. 전체 읽음 처리 뮤테이션
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  // 알림 목록 펼치기
  const notifications = data?.pages.flatMap((page) => page.items) ?? [];

  // 특정 알림 액션 처리 함수
  const handleNotificationAction = async (
    notificationId: string,
    type: 'INVITE' | 'NOTICE' | 'REMINDER',
    targetPath?: string,
    isRead?: boolean,
  ) => {
    if (!isRead) {
      // 읽지 않은 알림인 경우 API 호출하여 읽음 처리 실행
      await markAsReadMutation.mutateAsync({ notificationId, type });
    }

    // 대상 경로가 존재하면 라우팅 처리
    if (targetPath) {
      navigate({ to: targetPath as never });
    }
  };

  // 전체 읽음 처리 버튼 액션
  const handleMarkAllAsRead = () => {
    if (notifications.some((n) => !n.isRead)) {
      markAllAsReadMutation.mutate();
    }
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
      {/* 모두 읽음 상단 헤더 영역 */}
      <div className="flex items-center justify-between border-b border-grey-10 pb-4">
        <h2 className="text-grey-100 typo-lg-b">새로운 알림</h2>
        {notifications.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending || !notifications.some((n) => !n.isRead)}
            className="flex items-center gap-1.5 text-grey-50 hover:text-grey-100 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            모두 읽음
          </Button>
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
            // 타입별 디자인 속성 매핑
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

            return (
              <div
                key={noti.notificationId}
                onClick={
                  noti.type !== 'INVITE'
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
                  noti.type !== 'INVITE' ? 'cursor-pointer hover:border-grey-30 hover:bg-grey-2/30 active:scale-[0.99]' : ''
                } ${
                  !noti.isRead
                    ? 'border-grey-20 bg-grey-2/50'
                    : 'border-grey-10 bg-white opacity-85'
                }`}
              >
                {/* 타입별 아이콘 영역 */}
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-center ${typeConfig.iconClass}`}
                >
                  <IconComponent className="h-5 w-5" />
                </div>

                {/* 알림 상세 텍스트 영역 */}
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

                  {/* INVITE 전용: 초대장 보기 액션 버튼 */}
                  {noti.type === 'INVITE' && (
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

                {/* 읽지 않음 파란 점 (dot) 표시 */}
                {!noti.isRead && (
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
