import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';

import { getUserDisplayName } from '@/features/users/labels';
import { formatDateTime, orDash } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { InfoList } from '@/shared/ui/Card';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';
import { Field, Textarea } from '@/shared/ui/Input';
import { Drawer } from '@/shared/ui/Modal';

import { useReport, useResolveReport } from '../api';
import {
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_TONES,
} from '../labels';
import type { ReportResolution, ReportUser } from '../types';

const UserLink = ({ user }: { user: ReportUser }) => (
  <Link
    to="/users/$userId"
    params={{ userId: user.userId }}
    className="text-sky-700 hover:underline"
  >
    {getUserDisplayName(user)}
  </Link>
);

interface ReportDrawerProps {
  reportId: string;
  onClose: () => void;
}

export const ReportDrawer = ({ reportId, onClose }: ReportDrawerProps) => {
  const { data: report, isPending, isError } = useReport(reportId);
  const resolveReport = useResolveReport(reportId);
  const [resolutionNote, setResolutionNote] = useState('');

  const handleResolve = (status: ReportResolution) => {
    resolveReport.mutate(
      { status, resolutionNote: resolutionNote.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`신고를 ${REPORT_STATUS_LABELS[status]} 처리했습니다.`);
          onClose();
        },
      },
    );
  };

  const renderBody = () => {
    if (isPending) {
      return <LoadingState />;
    }
    if (isError) {
      return <EmptyState title="신고를 불러오지 못했습니다." />;
    }

    return (
      <div className="space-y-6">
        <InfoList
          items={[
            {
              label: '상태',
              value: (
                <Badge tone={REPORT_STATUS_TONES[report.status]}>
                  {REPORT_STATUS_LABELS[report.status]}
                </Badge>
              ),
            },
            { label: '사유', value: REPORT_REASON_LABELS[report.reason] },
            { label: '신고자', value: <UserLink user={report.reporter} /> },
            {
              label: '피신고자',
              value: (
                <span className="flex items-center gap-1.5">
                  <UserLink user={report.reported} />
                  {report.reported.isSuspended && (
                    <Badge tone="red">정지 중</Badge>
                  )}
                </span>
              ),
            },
            { label: '신고일', value: formatDateTime(report.createdAt) },
            { label: '처리일', value: formatDateTime(report.resolvedAt) },
          ]}
        />

        <div>
          <p className="text-xs text-slate-500">상세 내용</p>
          <p className="mt-1 rounded-md bg-slate-50 p-3 text-sm whitespace-pre-line text-slate-800">
            {orDash(report.description)}
          </p>
        </div>

        <Link
          to="/users/$userId"
          params={{ userId: report.reported.userId }}
          className="inline-block text-sm font-medium text-sky-700 hover:underline"
        >
          피신고자 상세에서 제재하기 →
        </Link>

        {report.status === 'PENDING' ? (
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <Field label="처리 메모 (선택)">
              <Textarea
                rows={3}
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => handleResolve('DISMISSED')}
                disabled={resolveReport.isPending}
              >
                기각
              </Button>
              <Button
                onClick={() => handleResolve('RESOLVED')}
                disabled={resolveReport.isPending}
              >
                처리 완료
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t border-slate-100 pt-4">
            <InfoList
              columns={1}
              items={[
                { label: '처리자', value: report.resolvedBy?.name ?? '-' },
                {
                  label: '처리 메모',
                  value: (
                    <span className="whitespace-pre-line">
                      {orDash(report.resolutionNote)}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Drawer open title="신고 상세" onClose={onClose}>
      {renderBody()}
    </Drawer>
  );
};
