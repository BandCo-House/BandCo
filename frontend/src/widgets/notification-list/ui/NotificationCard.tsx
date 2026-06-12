import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import type {
  NotificationItem,
  NotificationType,
} from '@/entities/notification/model/types';
import { NotificationCardMenuSheet } from './NotificationCardMenuSheet';

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
  onDelete: (notificationId: string) => void;
  onMarkAsRead: (notificationId: string) => void;
};

export const NotificationCard = ({
  noti,
  isEditMode,
  isSelected,
  onToggleSelect,
  onAction,
  onDelete,
  onMarkAsRead,
}: NotificationCardProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
      className={`relative flex gap-3 rounded-lg border border-[rgba(39,43,34,0.8)] p-4 transition-all duration-200 ${
        isClickable ? 'cursor-pointer active:scale-[0.995]' : ''
      } ${
        !noti.isRead
          ? 'bg-[rgba(220,226,249,0.4)]'
          : 'bg-[rgba(101,99,122,0.48)]'
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
      <div className="flex flex-1 flex-col justify-center gap-0.5">
        <h3
          className={`typo-sm-b pr-6 ${
            !noti.isRead ? 'text-white' : 'text-[#C6C6C8]'
          }`}
        >
          {noti.title}
        </h3>
        <p
          className={`line-clamp-1 typo-xs-m pr-6 ${
            !noti.isRead ? 'text-[#C6C6C8]' : 'text-[#9D9D9F]'
          }`}
        >
          {noti.description}
        </p>

        {/* INVITE 전용 액션 버튼 영역 */}
        {noti.type === 'INVITE' && !isEditMode && (
          <div className="mt-3 flex items-center gap-4 self-end">
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
              className="typo-xs-m text-[#9CA578] transition-opacity hover:opacity-80"
            >
              초대장 보기
            </button>

            {/* 수락 / 수락됨 버튼 분기 */}
            {!noti.isRead ? (
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
                className="rounded-full border border-primary px-4 py-1.5 typo-xs-m text-primary transition-all hover:bg-primary hover:text-black"
              >
                수락
              </button>
            ) : (
              <div
                className="rounded-full border border-[#C6C6C8] bg-[rgba(39,43,34,0.8)] px-4 py-1.5 typo-xs-m text-[#C6C6C8] flex items-center gap-1 cursor-default select-none"
              >
                수락됨
              </div>
            )}
          </div>
        )}
      </div>

      {/* 우측 상단 세로 삼점 메뉴 버튼 */}
      {!isEditMode && (
        <button
          type="button"
          aria-label="알림 메뉴 열기"
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(true);
          }}
          className="absolute top-4 right-4 text-grey-200 hover:text-white transition-colors"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      )}

      {/* 바텀 모달 (분리된 Sheet 활용) */}
      <NotificationCardMenuSheet
        isOpen={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        noti={noti}
        onDelete={() => onDelete(noti.notificationId)}
        onMarkAsRead={() => onMarkAsRead(noti.notificationId)}
      />
    </div>
  );
};
