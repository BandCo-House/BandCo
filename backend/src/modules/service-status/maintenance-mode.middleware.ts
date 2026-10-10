import { HttpStatus, Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { ApiFailResponse } from 'src/common/api-response';

import type { ServiceStatus } from './types/service-status.type';
import { ServiceSettingsCache } from './service-settings-cache';

/**
 * 점검 중에도 열어 둘 경로. 어드민은 점검을 끄러 들어와야 하고, 앱은 점검 여부와 공지를 읽어 안내해야 한다.
 * 경로 경계까지 비교해 `/administrator`처럼 이름만 겹치는 경로는 통과시키지 않는다.
 * Swagger는 `/api-docs` 아래와 `/api-docs-json`을 쓰므로 둘 다 적는다.
 */
export const MAINTENANCE_EXEMPT_PATH_PREFIXES = ['/admin', '/service-status', '/announcements/active', '/api-docs', '/api-docs-json'] as const;

export const DEFAULT_MAINTENANCE_MESSAGE = '서비스 점검 중입니다. 잠시 후 다시 이용해 주세요.';

/** 미들웨어가 쓰는 요청의 최소 형태. express 타입 의존을 피한다 */
export interface MaintenanceRequest {
  method: string;
  originalUrl: string;
}

/** 미들웨어가 쓰는 응답의 최소 형태 */
export interface MaintenanceResponse {
  status(code: number): { json(body: unknown): void };
}

/**
 * 점검 중에도 통과시킬 경로인지 판정한다. 쿼리 문자열은 떼고 경로만 비교한다.
 *
 * @param {string} url - 요청 URL(쿼리 포함 가능)
 * @returns {boolean} 점검 중에도 통과시키면 true
 */
export function isMaintenanceExemptPath(url: string): boolean {
  const path = url.split('?')[0];
  return MAINTENANCE_EXEMPT_PATH_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * 점검 중 503 응답 본문. 글로벌 예외 필터와 같은 실패 envelope을 쓴다.
 *
 * @param {string | null} maintenanceMessage - 어드민이 설정한 점검 안내 문구
 * @returns {ApiFailResponse} 실패 응답 본문
 */
export function buildMaintenanceResponse(maintenanceMessage: string | null): ApiFailResponse {
  return {
    status: 'fail',
    error: { code: 'SERVICE_UNAVAILABLE', details: { statusCode: HttpStatus.SERVICE_UNAVAILABLE } },
    message: maintenanceMessage ?? DEFAULT_MAINTENANCE_MESSAGE,
    data: {},
  };
}

/**
 * 점검 모드가 켜져 있으면 예외 경로를 뺀 모든 요청을 503으로 막는다.
 * 인증보다 먼저 막아야 하므로 가드가 아니라 미들웨어로 둔다.
 */
@Injectable()
export class MaintenanceModeMiddleware implements NestMiddleware {
  private readonly logger = new Logger(MaintenanceModeMiddleware.name);

  constructor(private readonly serviceSettingsCache: ServiceSettingsCache) {}

  async use(request: MaintenanceRequest, response: MaintenanceResponse, next: () => void): Promise<void> {
    // CORS preflight는 본 요청이 막히면서 안내가 나가도록 통과시킨다.
    if (request.method === 'OPTIONS' || isMaintenanceExemptPath(request.originalUrl)) {
      next();
      return;
    }

    let serviceStatus: ServiceStatus;
    try {
      serviceStatus = await this.serviceSettingsCache.getServiceStatus();
    } catch (error) {
      // 설정을 못 읽었다고 전체 서비스를 막으면 장애가 커지므로 점검이 아닌 것으로 보고 통과시킨다.
      this.logger.warn({
        message: '서비스 설정을 읽지 못해 점검 여부 확인을 건너뜁니다.',
        error: error instanceof Error ? error.message : String(error),
      });
      next();
      return;
    }

    if (!serviceStatus.maintenanceEnabled) {
      next();
      return;
    }

    response.status(HttpStatus.SERVICE_UNAVAILABLE).json(buildMaintenanceResponse(serviceStatus.maintenanceMessage));
  }
}
