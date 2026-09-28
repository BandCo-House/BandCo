import { useNotificationHeaderState } from '@/entities/notification/model/notification-header-state';

/**
 * 알림 페이지 헤더 제목. 편집 모드에서는 제목 자리가 선택 개수를 맡는다.
 *
 * 개수를 오른쪽 액션 영역("n개 선택됨" + "n개 삭제")에서 두 번 말하던 걸 한 번으로 줄이고,
 * 액션 쪽은 아이콘만 남기기 위한 배치다. 선택 모드에 들어가면 헤더 전체가 그 모드 전용으로
 * 바뀌는 흔한 패턴(iOS 메일·Gmail)과 같은 방향이다.
 */
export const NotificationHeaderTitle = () => {
  const { isEditMode, selectedIds } = useNotificationHeaderState();

  return (
    <h1 className="min-w-0 truncate typo-lg-sb text-grey-50">
      {isEditMode ? `${selectedIds.size}개 선택` : '알림'}
    </h1>
  );
};
