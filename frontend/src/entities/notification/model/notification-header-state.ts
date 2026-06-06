import { useState, useEffect } from 'react';

/**
 * 알림 페이지 헤더와 페이지 컴포넌트 사이의 상태를 동기화하는 경량 펍섭 모듈.
 * react-refresh/only-export-components 제약에 따라 컴포넌트 파일에서 분리됨.
 */
export type NotificationHeaderState = {
  isEditMode: boolean;
  selectedIds: Set<string>;
  isDeletePending: boolean;
  hasNotifications: boolean;
  onDeleteSelected?: () => void;
  onCancelEdit?: () => void;
  onStartEdit?: () => void;
};

let headerState: NotificationHeaderState = {
  isEditMode: false,
  selectedIds: new Set(),
  isDeletePending: false,
  hasNotifications: false,
};

const headerListeners = new Set<() => void>();

export const updateNotificationHeader = (
  next: Partial<NotificationHeaderState>,
): void => {
  headerState = { ...headerState, ...next };
  headerListeners.forEach((l) => l());
};

export const getNotificationHeaderState = (): NotificationHeaderState =>
  headerState;

export const subscribeNotificationHeader = (listener: () => void): (() => void) => {
  headerListeners.add(listener);
  return () => {
    headerListeners.delete(listener);
  };
};

export const useNotificationHeaderState = (): NotificationHeaderState => {
  const [state, setState] = useState(headerState);

  useEffect(() => {
    return subscribeNotificationHeader(() => {
      setState(headerState);
    });
  }, []);

  return state;
};
