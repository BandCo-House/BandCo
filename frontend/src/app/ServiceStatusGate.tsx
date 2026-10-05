import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  serviceStatusKeys,
  useServiceStatus,
} from '@/entities/service-status/api/useServiceStatus';
import { subscribeServiceUnavailable } from '@/shared/api';
import { isVersionBelow } from '@/shared/lib/semver';
import {
  MaintenanceScreen,
  UpdateRequiredScreen,
} from '@/app/states/ServiceStatusScreens';

/**
 * 점검 모드·최소 버전을 확인해 앱 대신 안내 화면을 띄운다.
 *
 * 상태 조회가 실패하면 막지 않는다(fail-open) — 백엔드 점검 미들웨어와 같은 원칙이다.
 * 다른 API가 점검 503을 받으면 shared 구독으로 신호가 와서 상태를 즉시 다시 불러온다.
 */
export const ServiceStatusGate = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { data, isError, isFetching, refetch } = useServiceStatus();

  useEffect(
    () =>
      subscribeServiceUnavailable(() => {
        void queryClient.invalidateQueries({
          queryKey: serviceStatusKeys.all,
        });
      }),
    [queryClient],
  );

  const status = isError ? undefined : data;

  if (status?.maintenanceEnabled) {
    return (
      <MaintenanceScreen
        message={status.maintenanceMessage}
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  if (
    status?.minAppVersion &&
    isVersionBelow(__APP_VERSION__, status.minAppVersion)
  ) {
    return <UpdateRequiredScreen />;
  }

  return children;
};
