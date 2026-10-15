import { http, HttpResponse } from 'msw';
import type { ApiSuccessResponse } from '@/shared/api';
import type { ServiceStatus } from '@/entities/service-status/model/schema';
import { API_URL } from '../config';

// 기본은 정상 운영(점검 꺼짐, 최소 버전 없음). 점검·업데이트 화면은 server.use로 덮어 확인한다.
const serviceStatus: ServiceStatus = {
  maintenanceEnabled: false,
  maintenanceMessage: null,
  minAppVersion: null,
};

export const serviceStatusHandlers = [
  http.get(`${API_URL}/service-status`, () =>
    HttpResponse.json<ApiSuccessResponse<ServiceStatus>>({
      status: 'success',
      error: null,
      message: '요청 성공',
      data: serviceStatus,
    }),
  ),
];
