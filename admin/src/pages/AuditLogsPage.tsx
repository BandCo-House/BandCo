import { Fragment, useState, type FormEvent } from 'react';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { useAuditLogs } from '@/features/audit-logs/api';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_TARGET_TYPE_LABELS,
} from '@/features/audit-logs/labels';
import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
  type AuditAction,
  type AuditTargetType,
} from '@/features/audit-logs/types';
import { formatDateTime } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';
import { Field, Input } from '@/shared/ui/Input';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Pagination } from '@/shared/ui/Pagination';
import { Select } from '@/shared/ui/Select';
import { TBody, THead, Table, Td, Th, Tr } from '@/shared/ui/Table';

const routeApi = getRouteApi('/_auth/audit-logs');

const ALL_OPTION = { value: '', label: '전체' };

const ACTION_OPTIONS = [
  ALL_OPTION,
  ...AUDIT_ACTIONS.map((action) => ({
    value: action,
    label: `${AUDIT_ACTION_LABELS[action]} (${action})`,
  })),
];

const TARGET_TYPE_OPTIONS = [
  ALL_OPTION,
  ...AUDIT_TARGET_TYPES.map((targetType) => ({
    value: targetType,
    label: AUDIT_TARGET_TYPE_LABELS[targetType],
  })),
];

const TABLE_COLUMN_COUNT = 5;

export const AuditLogsPage = () => {
  const search = routeApi.useSearch();
  const navigate = useNavigate({ from: '/audit-logs' });
  const [targetId, setTargetId] = useState(search.targetId ?? '');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isPending, isError } = useAuditLogs({
    action: search.action,
    targetType: search.targetType,
    targetId: search.targetId,
    page: search.page ?? 1,
  });

  const handleTargetIdSubmit = (event: FormEvent) => {
    event.preventDefault();
    void navigate({
      search: (prev) => ({
        ...prev,
        targetId: targetId.trim() || undefined,
        page: undefined,
      }),
    });
  };

  const renderTable = () => {
    if (isPending) {
      return <LoadingState />;
    }
    if (isError) {
      return <EmptyState title="감사 로그를 불러오지 못했습니다." />;
    }
    if (data.items.length === 0) {
      return <EmptyState title="조건에 맞는 감사 로그가 없습니다." />;
    }

    return (
      <>
        <Table>
          <THead>
            <tr>
              <Th className="w-8" />
              <Th>시각</Th>
              <Th>관리자</Th>
              <Th>작업</Th>
              <Th>대상</Th>
            </tr>
          </THead>
          <TBody>
            {data.items.map((log) => {
              const expanded = expandedId === log.auditLogId;
              return (
                <Fragment key={log.auditLogId}>
                  <Tr
                    clickable
                    onClick={() =>
                      setExpandedId(expanded ? null : log.auditLogId)
                    }
                  >
                    <Td>
                      {expanded ? (
                        <ChevronDown className="size-4" aria-hidden />
                      ) : (
                        <ChevronRight className="size-4" aria-hidden />
                      )}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </Td>
                    <Td>
                      <div className="text-slate-900">{log.admin.name}</div>
                      <div className="text-xs text-slate-500">
                        {log.admin.email}
                      </div>
                    </Td>
                    <Td>{AUDIT_ACTION_LABELS[log.action] ?? log.action}</Td>
                    <Td>
                      <div>
                        {AUDIT_TARGET_TYPE_LABELS[log.targetType] ??
                          log.targetType}
                      </div>
                      {log.targetId && (
                        <div className="font-mono text-xs text-slate-500">
                          {log.targetId}
                        </div>
                      )}
                    </Td>
                  </Tr>
                  {expanded && (
                    <tr>
                      <td
                        colSpan={TABLE_COLUMN_COUNT}
                        className="bg-slate-50 px-3 py-3"
                      >
                        <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 font-mono text-xs text-slate-100">
                          {log.detail === null
                            ? '상세 정보 없음'
                            : JSON.stringify(log.detail, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </TBody>
        </Table>
        <Pagination
          pagination={data.pagination}
          onChange={(page) =>
            void navigate({ search: (prev) => ({ ...prev, page }) })
          }
        />
      </>
    );
  };

  return (
    <div>
      <PageHeader
        title="감사 로그"
        description="모든 어드민 쓰기 작업과 로그인이 최신순으로 기록됩니다."
      />
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-end gap-3 p-4">
          <Field label="작업">
            <Select
              value={search.action ?? ''}
              options={ACTION_OPTIONS}
              onChange={(event) =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    action: (event.target.value || undefined) as
                      AuditAction | undefined,
                    page: undefined,
                  }),
                })
              }
            />
          </Field>
          <Field label="대상 유형">
            <Select
              value={search.targetType ?? ''}
              options={TARGET_TYPE_OPTIONS}
              onChange={(event) =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    targetType: (event.target.value || undefined) as
                      AuditTargetType | undefined,
                    page: undefined,
                  }),
                })
              }
            />
          </Field>
          <form
            onSubmit={handleTargetIdSubmit}
            className="flex items-end gap-2"
          >
            <Field label="대상 ID">
              <Input
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
                placeholder="UUID"
                className="w-80"
              />
            </Field>
            <Button type="submit" variant="secondary">
              적용
            </Button>
          </form>
        </div>
        {renderTable()}
      </Card>
    </div>
  );
};
