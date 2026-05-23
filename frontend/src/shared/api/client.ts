import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import {
  ACCESS_TOKEN_REFRESH_ENDPOINT,
  API_BASE_URL,
  API_TIMEOUT,
  REFRESH_TOKEN_REFRESH_ENDPOINT,
} from './config';
import { type ApiResponse } from './types';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  clearTokens,
} from '../lib/auth-storage';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 인터셉터 사용으로 매 요청마다 자동으로 액세스 토큰 주입
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

let isRefreshing = false;

// 토큰 갱신 대기 중인 요청 큐 (갱신 중 동시 요청들을 모아뒀다가 한번에 재시도)
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * 백엔드 access token 재발급 계약에 맞춰 refresh token을 Bearer 헤더로 전송한다.
 */
export const refreshAccessToken = async (
  refreshToken: string,
): Promise<string> => {
  const { data } = await apiClient.post<{ accessToken: string }>(
    ACCESS_TOKEN_REFRESH_ENDPOINT,
    {},
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    },
  );

  return data.accessToken;
};

/**
 * 백엔드 refresh token 재발급 계약에 맞춰 refresh token을 Bearer 헤더로 전송한다.
 */
export const refreshRefreshToken = async (
  refreshToken: string,
): Promise<string> => {
  const { data } = await apiClient.post<{ refreshToken: string }>(
    REFRESH_TOKEN_REFRESH_ENDPOINT,
    {},
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    },
  );

  return data.refreshToken;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // 401이 아니거나 config가 없으면 그대로 에러 반환
    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // 토큰 재발급 요청에서 401이 오면 보유 토큰이 유효하지 않으므로 로그아웃한다.
    if (
      originalRequest.url?.includes(ACCESS_TOKEN_REFRESH_ENDPOINT) ||
      originalRequest.url?.includes(REFRESH_TOKEN_REFRESH_ENDPOINT)
    ) {
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 이미 토큰 갱신 중이면 큐에 넣고 대기
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      const newAccessToken = await refreshAccessToken(refreshToken);

      setAccessToken(newAccessToken);
      processQueue(null, newAccessToken);

      // 원래 요청 재시도
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

async function api<T>(config: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient<ApiResponse<T>>(config);
  return data.data;
}

export const apiGet = <T>(url: string, config?: AxiosRequestConfig) =>
  api<T>({ ...config, method: 'GET', url });

export const apiPost = <T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
) => api<T>({ ...config, method: 'POST', url, data: body });

export const apiPut = <T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
) => api<T>({ ...config, method: 'PUT', url, data: body });

export const apiPatch = <T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
) => api<T>({ ...config, method: 'PATCH', url, data: body });

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig) =>
  api<T>({ ...config, method: 'DELETE', url });
