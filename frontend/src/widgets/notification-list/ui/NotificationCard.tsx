import type {
  NotificationItem,
  NotificationType,
} from '@/entities/notification/model/types';

type NotificationCardProps = {
  noti: NotificationItem;
  isEditMode: boolean;
  isSelected: boolean;
  onToggleSelect: (notificationId: string) => void;
  onAction: (
    notificationId: string,
    type: NotificationType,
    targetPath?: string,
    isRead?: boolean,
  ) => void;
};

export const NotificationCard = ({
  noti,
  isEditMode,
  isSelected,
  onToggleSelect,
  onAction,
}: NotificationCardProps) => {
  const isClickable = isEditMode || noti.type !== 'INVITE';

  const handleClick = isClickable
    ? isEditMode
      ? () => onToggleSelect(noti.notificationId)
      : () =>
          onAction(noti.notificationId, noti.type, noti.targetPath, noti.isRead)
    : undefined;

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={
        isClickable
          ? isEditMode
            ? `${noti.title} ${isSelected ? '선택됨' : '선택 안 됨'}`
            : `${noti.title} 알림 열기`
          : undefined
      }
      onClick={handleClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick?.();
              }
            }
          : undefined
      }
      className={`relative flex gap-3 rounded-lg border p-4 transition-all duration-200 ${
        isClickable ? 'cursor-pointer active:scale-[0.995]' : ''
      } ${
        !noti.isRead
          ? 'border-border bg-surface-1'
          : 'border-border bg-surface-3 opacity-75'
      }`}
    >
      {/* 편집 모드 체크박스 */}
      {isEditMode && (
        <div className="flex shrink-0 items-center justify-center pr-1">
          <div
            className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-200 ${
              isSelected
                ? 'border-destructive bg-destructive text-white'
                : 'border-grey-300 bg-transparent'
            }`}
          >
            {isSelected && (
              <svg
                className="h-3 w-3 stroke-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* 알림 상세 텍스트 */}
      <div className="flex flex-1 flex-col justify-center gap-1">
        <h3
          className={`typo-sm-b ${
            !noti.isRead ? 'text-foreground' : 'text-grey-200'
          }`}
        >
          {noti.title}
        </h3>
        <p className="line-clamp-1 typo-xs-m text-grey-300">
          {noti.description}
        </p>

        {/* INVITE 전용 액션 버튼 영역 */}
        {noti.type === 'INVITE' && !isEditMode && (
          <div className="mt-2 flex items-center gap-4 self-end">
            {/* 초대장 보기 — primary-light(#9CA578) 텍스트 */}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction(
                  noti.notificationId,
                  noti.type,
                  noti.targetPath,
                  noti.isRead,
                );
              }}
              className="typo-xs-m text-primary-light"
            >
              초대장 보기
            </button>
            {/* 수락 버튼 — primary(#ECFCAB) 테두리+텍스트 */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction(
                  noti.notificationId,
                  noti.type,
                  noti.targetPath,
                  noti.isRead,
                );
              }}
              className="rounded-full border border-primary px-4 py-1.5 typo-xs-m text-primary transition-opacity hover:opacity-80"
            >
              수락
            </button>
          </div>
        )}
      </div>

      {/* 안 읽은 점 (우측 상단) */}
      {!noti.isRead && !isEditMode && (
        <span className="absolute top-4 right-4 h-1.5 w-1.5 rounded-full bg-destructive" />
      )}
    </div>
  );
};
