import type { AxiosError } from 'axios';

/** 점검 모드에서 백엔드가 503과 함께 돌려주는 error.code. */
export const SERVICE_UNAVAILABLE_CODE = 'SERVICE_UNAVAILABLE';

type ServiceUnavailableListener = () => void;

const listeners = new Set<ServiceUnavailableListener>();

/**
 * 점검 503 응답을 구독한다. shared가 상위 레이어(app의 점검 게이트)를 import하지 않도록
 * 인터셉터는 신호만 보내고, 게이트가 이 구독으로 서비스 상태를 다시 불러온다.
 * @returns 구독 해제 함수
 */
export const subscribeServiceUnavailable = (
  listener: ServiceUnavailableListener,
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const notifyServiceUnavailable = (): void => {
  listeners.forEach((listener) => listener());
};

export const isServiceUnavailableError = (error: AxiosError): boolean => {
  if (error.response?.status !== 503) return false;

  const data: unknown = error.response.data;
  if (typeof data !== 'object' || data === null || !('error' in data)) {
    return false;
  }

  const apiError: unknown = (data as { error: unknown }).error;
  return (
    typeof apiError === 'object' &&
    apiError !== null &&
    'code' in apiError &&
    (apiError as { code: unknown }).code === SERVICE_UNAVAILABLE_CODE
  );
};
