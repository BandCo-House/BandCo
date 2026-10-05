import { useState } from 'react';
import { getRouteApi, useNavigate } from '@tanstack/react-router';

import { useReports } from '@/features/reports/api';
import { ReportDrawer } from '@/features/reports/components/ReportDrawer';
import {
  REPORT_REASON_LABELS,
  REPORT_STATUSES,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_TONES,
} from '@/features/reports/labels';
import type { ReportStatus } from '@/features/reports/types';
import { getUserDisplayName } from '@/features/users/labels';
import { formatDateTime } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Pagination } from '@/shared/ui/Pagination';
import { TBody, THead, Table, Td, Th, Tr } from '@/shared/ui/Table';
import { Tabs } from '@/shared/ui/Tabs';

const routeApi = getRouteApi('/_auth/reports');

const ALL_FILTER = 'ALL';
type StatusTab = ReportStatus | typeof ALL_FILTER;

const STATUS_TABS: ReadonlyArray<{ value: StatusTab; label: string }> = [
  { value: ALL_FILTER, label: '전체' },
  ...REPORT_STATUSES.map((status) => ({
    value: status,
    label: REPORT_STATUS_LABELS[status],
  })),
];

export const ReportsPage = () => {
  const search = routeApi.useSearch();
  const navigate = useNavigate({ from: '/reports' });
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const { data, isPending, isError } = useReports({
    status: search.status,
    page: search.page ?? 1,
  });

  const handleStatusChange = (value: StatusTab) => {
    void navigate({
      search: {
        status: value === ALL_FILTER ? undefined : value,
        page: undefined,
      },
    });
  };

  const renderTable = () => {
    if (isPending) {
      return <LoadingState />;
    }
    if (isError) {
      return <EmptyState title="신고 목록을 불러오지 못했습니다." />;
    }
    if (data.items.length === 0) {
      return <EmptyState title="신고가 없습니다." />;
    }

    return (
      <>
        <Table>
          <THead>
            <tr>
              <Th>상태</Th>
              <Th>사유</Th>
              <Th>신고자</Th>
              <Th>피신고자</Th>
              <Th>신고일</Th>
              <Th>처리일</Th>
            </tr>
          </THead>
          <TBody>
            {data.items.map((report) => (
              <Tr
                key={report.reportId}
                clickable
                onClick={() => setSelectedReportId(report.reportId)}
              >
                <Td>
                  <Badge tone={REPORT_STATUS_TONES[report.status]}>
                    {REPORT_STATUS_LABELS[report.status]}
                  </Badge>
                </Td>
                <Td>{REPORT_REASON_LABELS[report.reason]}</Td>
                <Td>{getUserDisplayName(report.reporter)}</Td>
                <Td>
                  <span className="flex items-center gap-1.5">
                    {getUserDisplayName(report.reported)}
                    {report.reported.isSuspended && (
                      <Badge tone="red">정지 중</Badge>
                    )}
                  </span>
                </Td>
                <Td>{formatDateTime(report.createdAt)}</Td>
                <Td>{formatDateTime(report.resolvedAt)}</Td>
              </Tr>
            ))}
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
      <PageHeader title="신고" description="회원 신고를 검토하고 처리합니다." />
      <Card bodyClassName="p-0">
        <div className="px-4 pt-3">
          <Tabs
            tabs={STATUS_TABS}
            value={search.status ?? ALL_FILTER}
            onChange={handleStatusChange}
          />
        </div>
        {renderTable()}
      </Card>
      {selectedReportId && (
        <ReportDrawer
          key={selectedReportId}
          reportId={selectedReportId}
          onClose={() => setSelectedReportId(null)}
        />
      )}
    </div>
  );
};
