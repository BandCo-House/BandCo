import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  serviceStatusKeys,
  useDeployedAppVersion,
  useServiceStatus,
} from '@/entities/service-status/api/useServiceStatus';
import { subscribeServiceUnavailable } from '@/shared/api';
import { compareSemver, isVersionBelow } from '@/shared/lib/semver';
import {
  MaintenanceScreen,
  UpdateRequiredScreen,
} from '@/app/states/ServiceStatusScreens';

/**
 * 점검 모드·최소 버전을 확인해 앱 대신 안내 화면을 띄운다.
 *
 * 상태를 한 번도 읽지 못했으면 막지 않는다(fail-open) — 백엔드 점검 미들웨어와 같은 원칙이다.
 * 이미 받은 상태가 있으면 재조회가 실패해도 그 값을 유지한다. 점검 화면에서 재확인이 한 번 실패했다고
 * 앱이 잠깐 열렸다 다시 점검으로 바뀌는 깜빡임을 막는다.
 * 다른 API가 점검 503을 받으면 shared 구독으로 신호가 와서 상태를 즉시 다시 불러온다.
 *
 * 업데이트 화면은 배포된 버전(/version.json)이 최소 버전 이상일 때만 띄운다. 최소 버전을 아직 배포하지
 * 않은 값으로 잘못 넣으면 새로고침해도 풀리지 않아 전체 사용자가 막히기 때문이다. 배포 버전을 확인할 수
 * 없을 때도 같은 이유로 막지 않는다.
 */
export const ServiceStatusGate = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { data: status, isFetching, refetch } = useServiceStatus();

  useEffect(
    () =>
      subscribeServiceUnavailable(() => {
        // 503이 몰려 와도 진행 중인 조회를 취소하고 새로 시작하지 않고 그대로 쓴다.
        void queryClient.invalidateQueries(
          { queryKey: serviceStatusKeys.all },
          { cancelRefetch: false },
        );
      }),
    [queryClient],
  );

  const minAppVersion = status?.minAppVersion ?? null;
  const isBelowMinVersion =
    minAppVersion !== null && isVersionBelow(__APP_VERSION__, minAppVersion);
  const { data: deployedVersion } = useDeployedAppVersion(isBelowMinVersion);
  const versionGap =
    minAppVersion !== null && deployedVersion !== undefined
      ? compareSemver(deployedVersion, minAppVersion)
      : null;
  const canUpdateByReload = versionGap !== null && versionGap >= 0;

  if (status?.maintenanceEnabled) {
    return (
      <MaintenanceScreen
        message={status.maintenanceMessage}
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  if (isBelowMinVersion && canUpdateByReload) {
    return <UpdateRequiredScreen />;
  }

  return children;
};
