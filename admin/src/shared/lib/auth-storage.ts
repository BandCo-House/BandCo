// 내부 운영 도구라 토큰은 localStorage에 단순하게 보관한다.
const ACCESS_TOKEN_KEY = 'bandco-admin.accessToken';
const REFRESH_TOKEN_KEY = 'bandco-admin.refreshToken';

export const getAccessToken = (): string | null =>
  localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = (): string | null =>
  localStorage.getItem(REFRESH_TOKEN_KEY);

export const setAccessToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/** 재발급으로 이어갈 수 있는 토큰이 하나라도 있으면 로그인 상태로 본다. */
export const hasSession = (): boolean =>
  Boolean(getAccessToken() || getRefreshToken());
