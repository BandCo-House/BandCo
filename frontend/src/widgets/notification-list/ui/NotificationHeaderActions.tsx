import { Trash2 } from 'lucide-react';
import { useNotificationHeaderState } from '@/entities/notification/model/notification-header-state';

/**
 * 알림 페이지 헤더 오른쪽에 표시되는 편집/삭제/취소 액션 버튼.
 * notification-header-state 펍섭을 구독해 pages/notifications.tsx의 Route staticData에서 렌더링된다.
 */
export const NotificationHeaderActions = () => {
  const state = useNotificationHeaderState();

  if (state.isEditMode) {
    return (
      <div className="flex items-center gap-2">
        <span className="typo-xs-m text-foreground">
          {state.selectedIds.size}개 선택됨
        </span>
        <button
          type="button"
          onClick={() => state.onDeleteSelected?.()}
          disabled={state.selectedIds.size === 0 || state.isDeletePending}
          className="rounded-full border border-destructive px-3 py-1 typo-xs-m text-destructive disabled:opacity-40"
        >
          {state.selectedIds.size}개 삭제
        </button>
        <button
          type="button"
          onClick={() => state.onCancelEdit?.()}
          className="typo-xs-m text-grey-300"
        >
          취소
        </button>
      </div>
    );
  }

  if (!state.hasNotifications) return null;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => state.onStartEdit?.()}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 typo-xs-m text-grey-300 transition-colors hover:text-foreground"
        aria-label="편집 모드 활성화"
      >
        휴지통
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
