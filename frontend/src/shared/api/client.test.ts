import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from './client';
import { clearTokens, setTokens } from '@/shared/lib/auth-storage';
import {
  ACCESS_TOKEN_REFRESH_ENDPOINT,
  REFRESH_TOKEN_REFRESH_ENDPOINT,
} from './config';

// apiClient 인스턴스를 직접 패치 — fetch/xhr 어댑터 이슈 없음
const mock = new MockAdapter(apiClient);

beforeAll(() => {
  vi.stubGlobal('location', { href: '' });
});

afterEach(() => {
  mock.reset();
  clearTokens();
  vi.stubGlobal('location', { href: '' });
});

// ────────────────────────────────────────────────────────────
describe('① Request Interceptor — Access Token 주입', () => {
  it('localStorage에 토큰이 있으면 Authorization 헤더가 자동으로 붙는다', async () => {
    setTokens('test-access-token', 'test-refresh-token');

    let capturedAuth = '';
    mock.onGet('/teams').reply((config) => {
      capturedAuth = config.headers?.Authorization ?? '';
      return [200, { success: true, data: [] }];
    });

    await apiClient.get('/teams');
    expect(capturedAuth).toBe('Bearer test-access-token');
  });

  it('토큰이 없으면 Authorization 헤더가 없다', async () => {
    let capturedAuth: string | undefined = 'should-be-undefined';
    mock.onGet('/teams').reply((config) => {
      capturedAuth = config.headers?.Authorization;
      return [200, { success: true, data: [] }];
    });

    await apiClient.get('/teams');
    expect(capturedAuth).toBeUndefined();
  });
});

// ────────────────────────────────────────────────────────────
describe('② Response Interceptor — 401 토큰 갱신', () => {
  it('401 응답 시 refresh token을 Bearer 헤더로 보내 access token을 재발급하고 원래 요청을 재시도한다', async () => {
    setTokens('expired-token', 'valid-refresh-token');

    let callCount = 0;
    let lastAuth = '';
    let refreshAuth = '';

    mock.onGet('/teams').reply((config) => {
      callCount++;
      lastAuth = config.headers?.Authorization ?? '';
      if (callCount === 1) return [401, null];
      return [200, { success: true, data: [{ id: 1 }] }];
    });

    mock.onPost(ACCESS_TOKEN_REFRESH_ENDPOINT).reply((config) => {
      refreshAuth = config.headers?.Authorization ?? '';
      return [200, { accessToken: 'new-access-token' }];
    });

    const res = await apiClient.get('/teams');
    expect(callCount).toBe(2);
    expect(refreshAuth).toBe('Bearer valid-refresh-token');
    expect(lastAuth).toBe('Bearer new-access-token');
    expect(res.data).toEqual({ success: true, data: [{ id: 1 }] });
  });

  it('access token 재발급 성공 후 localStorage의 access token만 새 값으로 교체된다', async () => {
    setTokens('expired-token', 'valid-refresh-token');

    mock.onGet('/teams').reply((config) => {
      if (config.headers?.Authorization === 'Bearer expired-token')
        return [401, null];
      return [200, { success: true, data: [] }];
    });

    mock.onPost(ACCESS_TOKEN_REFRESH_ENDPOINT).reply(200, {
      accessToken: 'new-access-token',
    });

    await apiClient.get('/teams');
    expect(localStorage.getItem('access_token')).toBe('new-access-token');
    expect(localStorage.getItem('refresh_token')).toBe('valid-refresh-token');
  });
});

// ────────────────────────────────────────────────────────────
describe('③ 동시 요청 큐 (processQueue)', () => {
  it('갱신 중 동시 요청이 들어오면 refresh는 1번만, 대기 요청 모두 성공한다', async () => {
    setTokens('expired-token', 'valid-refresh-token');

    let refreshCount = 0;

    mock.onGet('/teams').reply((config) => {
      if (config.headers?.Authorization === 'Bearer expired-token')
        return [401, null];
      return [200, { success: true, data: 'teams' }];
    });
    mock.onGet('/schedules').reply((config) => {
      if (config.headers?.Authorization === 'Bearer expired-token')
        return [401, null];
      return [200, { success: true, data: 'schedules' }];
    });
    mock.onGet('/notifications').reply((config) => {
      if (config.headers?.Authorization === 'Bearer expired-token')
        return [401, null];
      return [200, { success: true, data: 'notifications' }];
    });
    mock.onPost(ACCESS_TOKEN_REFRESH_ENDPOINT).reply(() => {
      refreshCount++;
      return [200, { accessToken: 'new-token' }];
    });

    const [teams, schedules, notifications] = await Promise.all([
      apiClient.get('/teams'),
      apiClient.get('/schedules'),
      apiClient.get('/notifications'),
    ]);

    expect(refreshCount).toBe(1); // refresh는 딱 1번!
    expect(teams.data.data).toBe('teams');
    expect(schedules.data.data).toBe('schedules');
    expect(notifications.data.data).toBe('notifications');
  });
});

// ────────────────────────────────────────────────────────────
describe('④ 로그아웃 처리', () => {
  it('access token 재발급 요청이 401이면 토큰 삭제 후 /login으로 이동한다', async () => {
    setTokens('expired-token', 'expired-refresh-token');

    mock.onGet('/teams').reply(401, null);
    mock.onPost(ACCESS_TOKEN_REFRESH_ENDPOINT).reply(401, null);

    await expect(apiClient.get('/teams')).rejects.toThrow();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('refresh 토큰이 없으면 즉시 /login으로 이동한다', async () => {
    localStorage.setItem('access_token', 'expired-token');
    // refresh_token은 의도적으로 미설정

    mock.onGet('/teams').reply(401, null);

    await expect(apiClient.get('/teams')).rejects.toThrow();
    expect(window.location.href).toBe('/login');
  });

  it('401이 아닌 500 에러는 그대로 reject되고 /login 이동 없음', async () => {
    setTokens('valid-token', 'valid-refresh-token');

    mock.onGet('/teams').reply(500, null);

    await expect(apiClient.get('/teams')).rejects.toThrow();
    expect(window.location.href).not.toBe('/login');
  });

  it('refresh token 재발급 요청이 401이면 토큰 삭제 후 /login으로 이동한다', async () => {
    setTokens('valid-token', 'expired-refresh-token');

    mock.onPost(REFRESH_TOKEN_REFRESH_ENDPOINT).reply(401, null);

    await expect(
      apiClient.post(REFRESH_TOKEN_REFRESH_ENDPOINT, {}),
    ).rejects.toThrow();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(window.location.href).toBe('/login');
  });
});

// ────────────────────────────────────────────────────────────
describe('⑤ 로그인 요청의 401', () => {
  it('로그인 요청이 401이면 토큰 갱신을 시도하지 않고 그대로 reject되며 /login 이동도 없다', async () => {
    let refreshCount = 0;

    mock
      .onPost('/auth/login/email')
      .reply(401, { message: '비밀번호가 일치하지 않습니다.' });
    mock.onPost(ACCESS_TOKEN_REFRESH_ENDPOINT).reply(() => {
      refreshCount++;
      return [200, { accessToken: 'new-access-token' }];
    });

    await expect(apiClient.post('/auth/login/email', {})).rejects.toThrow();
    expect(refreshCount).toBe(0);
    expect(window.location.href).not.toBe('/login');
  });
});
