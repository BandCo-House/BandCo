import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/api';
import { apiGet, apiPatch } from '@/shared/api/client';
import type { Paginated } from '@/shared/api/types';

import type { Report, ReportListQuery, ResolveReportRequest } from './types';

export const reportKeys = {
  all: ['reports'] as const,
  list: (query: ReportListQuery) => [...reportKeys.all, 'list', query] as const,
  detail: (reportId: string) =>
    [...reportKeys.all, 'detail', reportId] as const,
};

export const getReports = (query: ReportListQuery) =>
  apiGet<Paginated<Report>>('/admin/reports', { params: query });

export const getReport = (reportId: string) =>
  apiGet<Report>(`/admin/reports/${reportId}`);

export const resolveReport = (reportId: string, body: ResolveReportRequest) =>
  apiPatch<Report>(`/admin/reports/${reportId}`, body);

export const useReports = (query: ReportListQuery) =>
  useQuery({
    queryKey: reportKeys.list(query),
    queryFn: () => getReports(query),
    placeholderData: keepPreviousData,
  });

export const useReport = (reportId: string) =>
  useQuery({
    queryKey: reportKeys.detail(reportId),
    queryFn: () => getReport(reportId),
  });

export const useResolveReport = (reportId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ResolveReportRequest) => resolveReport(reportId, body),
    // 대시보드의 대기 신고 수도 함께 바뀐다.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: reportKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
      ]),
  });
};
