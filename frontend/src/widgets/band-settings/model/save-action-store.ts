import { useSyncExternalStore } from 'react';

export interface BandSettingsSaveAction {
  canSave: boolean;
  isSaving: boolean;
  save: () => void;
}

let current: BandSettingsSaveAction | null = null;
const listeners = new Set<() => void>();

/**
 * 헤더의 `저장` 버튼과 본문 폼을 잇는 최소 스토어.
 * 헤더(RouteHeader)는 RootLayout이 Outlet 바깥에 그리기 때문에 context로는 닿지 않는다.
 * 폼이 저장 가능 여부와 핸들러를 등록하면 헤더 버튼이 그대로 읽어 쓴다.
 */
export const setBandSettingsSaveAction = (
  next: BandSettingsSaveAction | null,
): void => {
  current = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): BandSettingsSaveAction | null => current;

export const useBandSettingsSaveAction = (): BandSettingsSaveAction | null =>
  useSyncExternalStore(subscribe, getSnapshot, () => null);
