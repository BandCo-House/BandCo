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
      <div className="flex items-center gap-1">
        {/* 선택 개수는 제목 자리(NotificationHeaderTitle)가 말한다 — 여기선 액션만.
            삭제는 아이콘만 남기되, 눈으로 보는 정보와 같아지도록 개수를 aria-label에 넣는다. */}
        <button
          type="button"
          onClick={() => state.onDeleteSelected?.()}
          disabled={state.selectedIds.size === 0 || state.isDeletePending}
          aria-label={`선택한 알림 ${state.selectedIds.size}개 삭제`}
          className="inline-flex size-10 items-center justify-center rounded-full text-destructive transition-colors disabled:opacity-40"
        >
          <Trash2 aria-hidden="true" className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => state.onCancelEdit?.()}
          className="rounded-full px-2 py-1.5 typo-sm-sb text-grey-300"
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
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 typo-sm-sb text-grey-300 transition-colors hover:text-foreground"
        aria-label="편집 모드 활성화"
      >
        휴지통
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
