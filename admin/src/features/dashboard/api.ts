import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiGet } from '@/shared/api/client';
import { STORAGE_SCAN_TIMEOUT } from '@/shared/api/config';

import type {
  DashboardSummary,
  FunnelQuery,
  FunnelResult,
  SignupsResult,
  StorageResult,
} from './types';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
  signups: (days: number) => [...dashboardKeys.all, 'signups', days] as const,
  funnel: (query: FunnelQuery) =>
    [...dashboardKeys.all, 'funnel', query] as const,
  storage: () => [...dashboardKeys.all, 'storage'] as const,
};

export const getDashboardSummary = () =>
  apiGet<DashboardSummary>('/admin/dashboard/summary');

export const getSignups = (days: number) =>
  apiGet<SignupsResult>('/admin/dashboard/signups', { params: { days } });

export const getFunnel = (query: FunnelQuery) =>
  apiGet<FunnelResult>('/admin/dashboard/funnel', { params: query });

export const getStorage = () =>
  apiGet<StorageResult>('/admin/dashboard/storage', {
    timeout: STORAGE_SCAN_TIMEOUT,
  });

export const useDashboardSummary = () =>
  useQuery({ queryKey: dashboardKeys.summary(), queryFn: getDashboardSummary });

export const useSignups = (days: number) =>
  useQuery({
    queryKey: dashboardKeys.signups(days),
    queryFn: () => getSignups(days),
    placeholderData: keepPreviousData,
  });

export const useFunnel = (query: FunnelQuery) =>
  useQuery({
    queryKey: dashboardKeys.funnel(query),
    queryFn: () => getFunnel(query),
    placeholderData: keepPreviousData,
  });

/** S3 전체 스캔이라 비싸므로 자동 조회하지 않고 refetch()로만 실행한다. */
export const useStorageScan = () =>
  useQuery({
    queryKey: dashboardKeys.storage(),
    queryFn: getStorage,
    enabled: false,
    staleTime: Infinity,
  });
