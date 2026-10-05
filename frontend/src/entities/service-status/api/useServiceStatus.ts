import { useQuery } from '@tanstack/react-query';
import { getDeployedAppVersion } from './deployed-version-api';
import { getServiceStatus } from './service-status-api';

export const serviceStatusKeys = {
  all: ['service-status'] as const,
};

export const deployedAppVersionKeys = {
  all: ['deployed-app-version'] as const,
};

const NORMAL_REFETCH_INTERVAL_MS = 5 * 60 * 1000;
// 점검 중에는 해제를 빨리 알아채도록 짧게 다시 확인한다.
const MAINTENANCE_REFETCH_INTERVAL_MS = 30 * 1000;

/**
 * 서비스 상태를 주기적으로 조회한다. 점검 중이면 30초, 아니면 5분 간격으로 다시 확인하고
 * 창에 포커스가 돌아올 때도 다시 불러온다.
 */
export const useServiceStatus = () =>
  useQuery({
    queryKey: serviceStatusKeys.all,
    queryFn: getServiceStatus,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      query.state.data?.maintenanceEnabled
        ? MAINTENANCE_REFETCH_INTERVAL_MS
        : NORMAL_REFETCH_INTERVAL_MS,
  });

/**
 * 배포된 최신 앱 버전을 조회한다. 현재 버전이 최소 버전보다 낮을 때만 켠다.
 */
export const useDeployedAppVersion = (enabled: boolean) =>
  useQuery({
    queryKey: deployedAppVersionKeys.all,
    queryFn: getDeployedAppVersion,
    enabled,
    staleTime: 0,
  });
