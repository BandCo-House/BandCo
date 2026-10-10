import type { ServiceStatusRepository } from './repositories/service-status.repository';
import type { ServiceStatus } from './types/service-status.type';
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  isMaintenanceExemptPath,
  MaintenanceModeMiddleware,
  type MaintenanceRequest,
  type MaintenanceResponse,
} from './maintenance-mode.middleware';
import { ServiceSettingsCache } from './service-settings-cache';

// ─── Stub ────────────────────────────────────────────────────────
function createServiceSettingsCacheStub(status: ServiceStatus | Error): ServiceSettingsCache {
  const repository: ServiceStatusRepository = {
    async findServiceStatus() {
      if (status instanceof Error) {
        throw status;
      }
      return status;
    },
    async findActiveAnnouncements() {
      return [];
    },
  };
  return new ServiceSettingsCache(repository, () => 0);
}

type CapturedResponse = { statusCode: number | null; body: unknown };

function createResponseStub(): { response: MaintenanceResponse; captured: CapturedResponse } {
  const captured: CapturedResponse = { statusCode: null, body: null };
  const response: MaintenanceResponse = {
    status(code) {
      captured.statusCode = code;
      return {
        json(body) {
          captured.body = body;
        },
      };
    },
  };
  return { response, captured };
}

async function runMiddleware(
  status: ServiceStatus | Error,
  request: MaintenanceRequest,
): Promise<{ isNextCalled: boolean; captured: CapturedResponse }> {
  const middleware = new MaintenanceModeMiddleware(createServiceSettingsCacheStub(status));
  const { response, captured } = createResponseStub();
  let isNextCalled = false;

  await middleware.use(request, response, () => {
    isNextCalled = true;
  });

  return { isNextCalled, captured };
}

const MAINTENANCE_ON: ServiceStatus = { maintenanceEnabled: true, maintenanceMessage: '10시까지 점검합니다.', minAppVersion: null };
const MAINTENANCE_OFF: ServiceStatus = { maintenanceEnabled: false, maintenanceMessage: null, minAppVersion: null };

describe('isMaintenanceExemptPath', () => {
  it.each([
    '/admin/auth/login',
    '/admin/service-settings',
    '/service-status',
    '/announcements/active',
    '/api-docs',
    '/api-docs-json',
    '/api-docs/swagger-ui.css',
  ])('%s는 점검 중에도 통과시킨다', path => {
    expect(isMaintenanceExemptPath(path)).toBe(true);
  });

  it('쿼리 문자열이 붙어 있어도 경로만 보고 판정한다', () => {
    expect(isMaintenanceExemptPath('/service-status?platform=ios')).toBe(true);
  });

  it.each(['/', '/users/me', '/bands', '/announcements', '/auth/login/email', '/users/admin', '/v1/admin', '/administrator', '/service-status-x'])(
    '%s는 점검 중에 막는다',
    path => {
      expect(isMaintenanceExemptPath(path)).toBe(false);
    },
  );

  it('예외 경로 문자열이 쿼리에만 있으면 막는다', () => {
    expect(isMaintenanceExemptPath('/bands?next=/admin')).toBe(false);
  });
});

describe('MaintenanceModeMiddleware', () => {
  it('점검 중이면 일반 요청을 503 실패 envelope으로 막는다', async () => {
    const { isNextCalled, captured } = await runMiddleware(MAINTENANCE_ON, { method: 'GET', originalUrl: '/bands' });

    expect(isNextCalled).toBe(false);
    expect(captured.statusCode).toBe(503);
    expect(captured.body).toEqual({
      status: 'fail',
      error: { code: 'SERVICE_UNAVAILABLE', details: { statusCode: 503 } },
      message: '10시까지 점검합니다.',
      data: {},
    });
  });

  it('점검 문구가 없으면 기본 문구로 응답한다', async () => {
    const { captured } = await runMiddleware({ ...MAINTENANCE_ON, maintenanceMessage: null }, { method: 'POST', originalUrl: '/users/me' });

    expect(captured.body).toMatchObject({ message: DEFAULT_MAINTENANCE_MESSAGE });
  });

  it('점검 중이어도 예외 경로는 통과시킨다', async () => {
    const { isNextCalled, captured } = await runMiddleware(MAINTENANCE_ON, { method: 'PATCH', originalUrl: '/admin/service-settings' });

    expect(isNextCalled).toBe(true);
    expect(captured.statusCode).toBeNull();
  });

  it('점검 중이어도 CORS preflight(OPTIONS)는 통과시킨다', async () => {
    const { isNextCalled } = await runMiddleware(MAINTENANCE_ON, { method: 'OPTIONS', originalUrl: '/bands' });

    expect(isNextCalled).toBe(true);
  });

  it('점검 중이 아니면 통과시킨다', async () => {
    const { isNextCalled, captured } = await runMiddleware(MAINTENANCE_OFF, { method: 'GET', originalUrl: '/bands' });

    expect(isNextCalled).toBe(true);
    expect(captured.statusCode).toBeNull();
  });

  it('설정을 읽지 못하면 막지 않고 통과시킨다', async () => {
    const { isNextCalled, captured } = await runMiddleware(new Error('DB 연결 실패'), { method: 'GET', originalUrl: '/bands' });

    expect(isNextCalled).toBe(true);
    expect(captured.statusCode).toBeNull();
  });
});
