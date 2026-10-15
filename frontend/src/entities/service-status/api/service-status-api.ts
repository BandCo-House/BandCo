import { apiGet } from '@/shared/api';
import { serviceStatusSchema, type ServiceStatus } from '../model/schema';

/**
 * 점검 여부와 최소 앱 버전을 조회한다(GET /service-status, 인증 없음).
 * 점검 중에도 이 경로는 503 대상에서 빠져 있다.
 */
export const getServiceStatus = async (): Promise<ServiceStatus> => {
  const data = await apiGet<unknown>('/service-status');
  return serviceStatusSchema.parse(data);
};
