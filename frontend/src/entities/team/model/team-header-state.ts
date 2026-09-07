import { useState, useEffect } from 'react';

/**
 * 팀 상세/수정 페이지와 최상단 공통 헤더 사이의 상태 및 액션을 동기화하는 펍섭(옵저버) 모듈.
 * 알림(NotificationHeaderState) 패턴과 동일하게 설계됨.
 */
export type TeamHeaderState = {
  isEditing: boolean;
  isSaving?: boolean;
  onDeleteTeam?: () => void;
  onSaveMembers?: () => void;
  onToggleEdit?: () => void;
};

let headerState: TeamHeaderState = {
  isEditing: false,
  isSaving: false,
};

const headerListeners = new Set<() => void>();

export const updateTeamHeader = (next: Partial<TeamHeaderState>): void => {
  headerState = { ...headerState, ...next };
  headerListeners.forEach((listener) => listener());
};

export const getTeamHeaderState = (): TeamHeaderState => headerState;

export const subscribeTeamHeader = (listener: () => void): (() => void) => {
  headerListeners.add(listener);
  return () => {
    headerListeners.delete(listener);
  };
};

export const useTeamHeaderState = (): TeamHeaderState => {
  const [state, setState] = useState(headerState);

  useEffect(() => {
    return subscribeTeamHeader(() => {
      setState(headerState);
    });
  }, []);

  return state;
};
