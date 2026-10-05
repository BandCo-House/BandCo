export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const API_TIMEOUT = 15_000;

// 스토리지 스캔은 S3 버킷 전체를 훑으므로 일반 요청보다 오래 기다린다.
export const STORAGE_SCAN_TIMEOUT = 120_000;

export const LOGIN_ENDPOINT = '/admin/auth/login';

export const ACCESS_TOKEN_REFRESH_ENDPOINT = '/admin/auth/token/access';

/**
 * 앱이 올라간 기준 경로(배포·개발 모두 /admin). 라우터 location은 이 값을 뺀 경로라,
 * 브라우저 주소를 직접 다루는 곳(history.push, window.location)에서는 다시 붙여야 한다.
 */
export const APP_BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

export const LOGIN_PATH = `${APP_BASE_PATH}/login`;
