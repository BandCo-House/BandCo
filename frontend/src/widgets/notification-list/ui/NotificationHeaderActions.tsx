import { Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
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
        <span className="mr-1 typo-base-m font-bold text-red-500">
          {state.selectedIds.size}개 선택됨
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => state.onDeleteSelected?.()}
          disabled={state.selectedIds.size === 0 || state.isDeletePending}
          className="h-8 rounded-lg border-red-200 px-3 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          {state.selectedIds.size}개 삭제하기
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => state.onCancelEdit?.()}
          className="hover:bg-grey-5 h-8 rounded-lg text-xs font-medium text-grey-50"
        >
          취소
        </Button>
      </div>
    );
  }

  if (!state.hasNotifications) return null;

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => state.onStartEdit?.()}
        className="flex h-8 w-8 items-center justify-center rounded-lg p-0 text-grey-50 transition-colors hover:bg-red-50/50 hover:text-red-500"
        aria-label="편집 모드 활성화"
      >
        <Trash2 className="h-4.5 w-4.5" />
      </Button>
    </div>
  );
};
