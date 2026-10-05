import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiGet } from '@/shared/api';
import type { ServiceStatus } from '@/entities/service-status/model/schema';
import { serviceStatusKeys } from '@/entities/service-status/api/useServiceStatus';
import { API_URL } from '@/mocks/config';
import { server } from '@/mocks/server';
import { ServiceStatusGate } from './ServiceStatusGate';

const NORMAL_STATUS: ServiceStatus = {
  maintenanceEnabled: false,
  maintenanceMessage: null,
  minAppVersion: null,
};

const respondStatus = (status: ServiceStatus) =>
  HttpResponse.json({
    status: 'success',
    error: null,
    message: '요청 성공',
    data: status,
  });

const renderGate = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ServiceStatusGate>
        <p data-testid="app-content">앱 화면</p>
      </ServiceStatusGate>
    </QueryClientProvider>,
  );
  return queryClient;
};

describe('ServiceStatusGate', () => {
  it('점검이 꺼져 있고 최소 버전이 없으면 앱 화면을 그대로 보여준다', async () => {
    const queryClient = renderGate();

    await waitFor(() =>
      expect(queryClient.getQueryState(serviceStatusKeys.all)?.status).toBe(
        'success',
      ),
    );
    expect(screen.getByTestId('app-content')).toBeInTheDocument();
  });

  it('점검 중이면 앱 대신 점검 안내와 운영 문구를 보여준다', async () => {
    server.use(
      http.get(`${API_URL}/service-status`, () =>
        respondStatus({
          ...NORMAL_STATUS,
          maintenanceEnabled: true,
          maintenanceMessage: '02:00까지 점검합니다.',
        }),
      ),
    );

    renderGate();

    expect(
      await screen.findByRole('heading', { name: '서비스 점검 중' }),
    ).toBeInTheDocument();
    expect(screen.getByText('02:00까지 점검합니다.')).toBeInTheDocument();
    expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
  });

  it('점검 문구가 없으면 기본 안내 문구를 보여준다', async () => {
    server.use(
      http.get(`${API_URL}/service-status`, () =>
        respondStatus({ ...NORMAL_STATUS, maintenanceEnabled: true }),
      ),
    );

    renderGate();

    expect(
      await screen.findByText(
        '서비스 점검 중입니다. 잠시 후 다시 이용해 주세요.',
      ),
    ).toBeInTheDocument();
  });

  it('점검 화면의 다시 확인은 상태를 다시 불러오고, 점검이 끝났으면 앱으로 돌아간다', async () => {
    const user = userEvent.setup();
    let maintenanceEnabled = true;
    server.use(
      http.get(`${API_URL}/service-status`, () =>
        respondStatus({ ...NORMAL_STATUS, maintenanceEnabled }),
      ),
    );

    renderGate();
    const retryButton = await screen.findByRole('button', {
      name: '다시 확인',
    });

    maintenanceEnabled = false;
    await user.click(retryButton);

    expect(await screen.findByTestId('app-content')).toBeInTheDocument();
  });

  it('현재 버전이 최소 버전보다 낮으면 업데이트 안내를 보여준다', async () => {
    server.use(
      http.get(`${API_URL}/service-status`, () =>
        respondStatus({ ...NORMAL_STATUS, minAppVersion: '999.0.0' }),
      ),
    );

    renderGate();

    expect(
      await screen.findByRole('heading', { name: '업데이트가 필요해요' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '새로고침' }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
  });

  it('최소 버전 값을 해석할 수 없으면 막지 않는다', async () => {
    server.use(
      http.get(`${API_URL}/service-status`, () =>
        respondStatus({ ...NORMAL_STATUS, minAppVersion: 'latest' }),
      ),
    );

    const queryClient = renderGate();

    await waitFor(() =>
      expect(queryClient.getQueryState(serviceStatusKeys.all)?.status).toBe(
        'success',
      ),
    );
    expect(screen.getByTestId('app-content')).toBeInTheDocument();
  });

  it('상태 조회가 실패하면 막지 않고 앱 화면을 보여준다(fail-open)', async () => {
    server.use(
      http.get(`${API_URL}/service-status`, () =>
        HttpResponse.json(
          {
            status: 'fail',
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              details: { statusCode: 500 },
            },
            message: '서버 오류',
            data: {},
          },
          { status: 500 },
        ),
      ),
    );

    const queryClient = renderGate();

    await waitFor(() =>
      expect(queryClient.getQueryState(serviceStatusKeys.all)?.status).toBe(
        'error',
      ),
    );
    expect(screen.getByTestId('app-content')).toBeInTheDocument();
  });

  it('다른 API가 점검 503을 받으면 상태를 다시 불러와 점검 안내로 전환한다', async () => {
    let maintenanceEnabled = false;
    server.use(
      http.get(`${API_URL}/service-status`, () =>
        respondStatus({ ...NORMAL_STATUS, maintenanceEnabled }),
      ),
      http.get(`${API_URL}/bands`, () =>
        HttpResponse.json(
          {
            status: 'fail',
            error: {
              code: 'SERVICE_UNAVAILABLE',
              details: { statusCode: 503 },
            },
            message: '서비스 점검 중입니다.',
            data: {},
          },
          { status: 503 },
        ),
      ),
    );

    const queryClient = renderGate();
    await waitFor(() =>
      expect(queryClient.getQueryState(serviceStatusKeys.all)?.status).toBe(
        'success',
      ),
    );
    expect(screen.getByTestId('app-content')).toBeInTheDocument();

    maintenanceEnabled = true;
    await expect(apiGet('/bands')).rejects.toThrow();

    expect(
      await screen.findByRole('heading', { name: '서비스 점검 중' }),
    ).toBeInTheDocument();
  });
});
