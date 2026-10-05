import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from '@/shared/lib/auth-storage';

import {
  ACCESS_TOKEN_REFRESH_ENDPOINT,
  API_BASE_URL,
  API_TIMEOUT,
  LOGIN_ENDPOINT,
  LOGIN_PATH,
} from './config';
import { createRefreshDeduper } from './refresh';
import type { ApiSuccessResponse } from './types';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** refresh 토큰을 Bearer로 보내 새 access 토큰을 받아 저장한다. */
const requestAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('리프레시 토큰이 없습니다.');
  }

  const { data } = await apiClient.post<
    ApiSuccessResponse<{ accessToken: string }>
  >(ACCESS_TOKEN_REFRESH_ENDPOINT, undefined, {
    headers: { Authorization: `Bearer ${refreshToken}` },
  });

  setAccessToken(data.data.accessToken);
  return data.data.accessToken;
};

const refreshAccessToken = createRefreshDeduper(requestAccessToken);

/** 세션을 이어갈 수 없으면 토큰을 지우고 로그인 화면으로 보낸다. */
const expireSession = (): void => {
  clearTokens();
  if (window.location.pathname !== LOGIN_PATH) {
    window.location.assign(LOGIN_PATH);
  }
};

// 로그인 실패(자격 증명 오류)와 재발급 요청 자체의 401은 재발급 대상이 아니다.
const NO_REFRESH_ENDPOINTS = [LOGIN_ENDPOINT, ACCESS_TOKEN_REFRESH_ENDPOINT];

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      NO_REFRESH_ENDPOINTS.some((endpoint) =>
        originalRequest.url?.startsWith(endpoint),
      )
    ) {
      return Promise.reject(error);
    }

    // 새 토큰으로 재시도했는데도 401이면 세션이 끊긴 것이다.
    if (originalRequest._retried) {
      expireSession();
      return Promise.reject(error);
    }
    originalRequest._retried = true;

    try {
      const token = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return apiClient(originalRequest);
    } catch {
      expireSession();
      return Promise.reject(error);
    }
  },
);

/** 성공 봉투에서 data만 꺼내 돌려준다. 실패 봉투는 axios가 reject한다. */
const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const { data } = await apiClient<ApiSuccessResponse<T>>(config);
  return data.data;
};

export const apiGet = <T>(url: string, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: 'GET', url });

export const apiPost = <T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
) => request<T>({ ...config, method: 'POST', url, data: body });

export const apiPatch = <T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
) => request<T>({ ...config, method: 'PATCH', url, data: body });

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: 'DELETE', url });
