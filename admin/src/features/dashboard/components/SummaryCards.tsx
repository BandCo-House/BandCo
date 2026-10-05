import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';

import { formatDateTime, formatNumber } from '@/shared/lib/format';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';

import { useDashboardSummary } from '../api';

interface StatCardProps {
  label: string;
  value: number;
  children?: ReactNode;
}

const StatCard = ({ label, value, children }: StatCardProps) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-slate-900">
      {formatNumber(value)}
    </p>
    {children && (
      <div className="mt-2 space-y-0.5 text-xs text-slate-500">{children}</div>
    )}
  </div>
);

const SubStat = ({ label, value }: { label: string; value: number }) => (
  <div className="flex justify-between gap-2">
    <span>{label}</span>
    <span className="font-medium text-slate-700">{formatNumber(value)}</span>
  </div>
);

export const SummaryCards = () => {
  const { data, isPending, isError } = useDashboardSummary();

  if (isPending) {
    return <LoadingState />;
  }
  if (isError) {
    return <EmptyState title="요약 지표를 불러오지 못했습니다." />;
  }

  const { users, activity, bands, bandSpaces, schedules, reports } = data;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="회원 (탈퇴 제외)" value={users.total}>
          <SubStat label="활성" value={users.active} />
          <SubStat label="비활성" value={users.inactive} />
          <SubStat label="이용 정지" value={users.suspended} />
          <SubStat label="탈퇴" value={users.deleted} />
        </StatCard>
        <StatCard label="신규 가입 (오늘)" value={users.newToday}>
          <SubStat label="최근 7일" value={users.newLast7Days} />
          <SubStat label="최근 30일" value={users.newLast30Days} />
        </StatCard>
        <StatCard label="DAU" value={activity.dau}>
          <SubStat label="WAU" value={activity.wau} />
          <SubStat label="MAU" value={activity.mau} />
          <p className="pt-1 text-[11px] text-slate-400">
            마지막 로그인 기준 근사치
          </p>
        </StatCard>
        <StatCard label="밴드" value={bands.total}>
          <SubStat label="최근 30일 활동" value={bands.activeLast30Days} />
          <SubStat label="밴드 스페이스" value={bandSpaces.total} />
        </StatCard>
        <StatCard label="일정" value={schedules.total}>
          <SubStat label="최근 30일 생성" value={schedules.createdLast30Days} />
        </StatCard>
        <StatCard label="대기 중 신고" value={reports.pending}>
          <Link
            to="/reports"
            search={{ status: 'PENDING' }}
            className="text-sky-700 hover:underline"
          >
            신고 목록 보기
          </Link>
        </StatCard>
      </div>
      <p className="mt-2 text-right text-xs text-slate-400">
        집계 시각 {formatDateTime(data.generatedAt)}
      </p>
    </div>
  );
};
