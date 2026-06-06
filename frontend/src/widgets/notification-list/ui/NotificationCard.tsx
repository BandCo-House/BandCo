import { Mail, Megaphone, Clock } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { NotificationItem, NotificationType } from '@/entities/notification/model/types';

// 타입별 UI 설정
const TYPE_CONFIG = {
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
} as const;

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
  const typeConfig = TYPE_CONFIG[noti.type];
  const IconComponent = typeConfig.icon;
  const isClickable = isEditMode || noti.type !== 'INVITE';

  const handleClick = isClickable
    ? isEditMode
      ? () => onToggleSelect(noti.notificationId)
      : () => onAction(noti.notificationId, noti.type, noti.targetPath, noti.isRead)
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
      className={`group relative flex gap-4 rounded-xl border p-4.5 transition-all duration-200 ${
        isClickable
          ? 'hover:border-grey-30 hover:bg-grey-2/30 cursor-pointer active:scale-[0.995]'
          : ''
      } ${
        !noti.isRead
          ? 'border-grey-20 bg-grey-2/50'
          : 'border-grey-10 bg-white opacity-85'
      }`}
    >
      {/* 편집 모드 체크박스 */}
      {isEditMode && (
        <div className="flex shrink-0 items-center justify-center pr-1">
          <div
            className={`flex h-5.5 w-5.5 items-center justify-center rounded-full border transition-all duration-200 ${
              isSelected
                ? 'border-red-500 bg-red-500 text-white'
                : 'border-grey-30 bg-white hover:border-grey-50'
            }`}
          >
            {isSelected && (
              <svg
                className="h-3 w-3 stroke-3"
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

      {/* 타입별 아이콘 */}
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-center ${typeConfig.iconClass}`}
      >
        <IconComponent className="h-5 w-5" />
      </div>

      {/* 알림 상세 텍스트 */}
      <div className="flex flex-1 flex-col justify-center gap-1 pr-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-wide uppercase opacity-75">
            {typeConfig.label}
          </span>
        </div>
        <h3
          className={`typo-base-m ${
            !noti.isRead ? 'font-semibold text-grey-100' : 'text-grey-60'
          }`}
        >
          {noti.title}
        </h3>
        <p className="mt-0.5 line-clamp-2 typo-sm-r leading-relaxed text-grey-50">
          {noti.description}
        </p>

        {/* INVITE 전용: 초대장 보기 버튼 */}
        {noti.type === 'INVITE' && !isEditMode && (
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={(e) => {
                e.stopPropagation();
                onAction(noti.notificationId, noti.type, noti.targetPath, noti.isRead);
              }}
              className="h-8.5 rounded-lg px-4.5 text-xs font-semibold"
            >
              초대장 보기
            </Button>
          </div>
        )}
      </div>

      {/* 안 읽은 파란 점 */}
      {!noti.isRead && !isEditMode && (
        <span className="absolute top-4.5 right-4.5 h-2 w-2 animate-pulse rounded-full bg-blue-500" />
      )}
    </div>
  );
};
