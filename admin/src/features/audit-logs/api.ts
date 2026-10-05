import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiGet } from '@/shared/api/client';
import type { Paginated } from '@/shared/api/types';

import type { AuditLog, AuditLogQuery } from './types';

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  list: (query: AuditLogQuery) => [...auditLogKeys.all, query] as const,
};

export const getAuditLogs = (query: AuditLogQuery) =>
  apiGet<Paginated<AuditLog>>('/admin/audit-logs', { params: query });

export const useAuditLogs = (query: AuditLogQuery) =>
  useQuery({
    queryKey: auditLogKeys.list(query),
    queryFn: () => getAuditLogs(query),
    placeholderData: keepPreviousData,
  });
