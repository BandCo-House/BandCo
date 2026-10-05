import { useState } from 'react';
import { Link, getRouteApi } from '@tanstack/react-router';
import { ArrowLeft, Ban, UserX } from 'lucide-react';

import { useUser } from '@/features/users/api';
import { SanctionsPanel } from '@/features/users/components/SanctionsPanel';
import { UserActionsCard } from '@/features/users/components/UserActionsCard';
import { UserNotificationsPanel } from '@/features/users/components/UserNotificationsPanel';
import { UserProfilePanel } from '@/features/users/components/UserProfilePanel';
import { UserStateBadge } from '@/features/users/components/UserStateBadge';
import { getUserDisplayName } from '@/features/users/labels';
import { formatDateTime } from '@/shared/lib/format';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Tabs } from '@/shared/ui/Tabs';

const routeApi = getRouteApi('/_auth/users/$userId');

type DetailTab = 'profile' | 'sanctions' | 'notifications';

const DETAIL_TABS: ReadonlyArray<{ value: DetailTab; label: string }> = [
  { value: 'profile', label: '정보' },
  { value: 'sanctions', label: '제재' },
  { value: 'notifications', label: '알림' },
];

export const UserDetailPage = () => {
  const { userId } = routeApi.useParams();
  const { data: user, isPending, isError } = useUser(userId);
  const [tab, setTab] = useState<DetailTab>('profile');

  if (isPending) {
    return <LoadingState />;
  }
  if (isError) {
    return <EmptyState title="회원 정보를 불러오지 못했습니다." />;
  }

  return (
    <div>
      <Link
        to="/users"
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" aria-hidden />
        회원 목록
      </Link>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {getUserDisplayName(user)}
            <UserStateBadge {...user} />
          </span>
        }
        description={user.email ?? user.userId}
      />

      {user.activeSuspension && (
        <div className="mb-4 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <Ban className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">
              이용 정지 중 ·{' '}
              {user.activeSuspension.endsAt
                ? `${formatDateTime(user.activeSuspension.endsAt)}까지`
                : '영구 정지'}
            </p>
            <p className="mt-1 whitespace-pre-line">
              {user.activeSuspension.reason}
            </p>
            <p className="mt-1 text-xs text-red-600">
              등록 {formatDateTime(user.activeSuspension.createdAt)}
            </p>
          </div>
        </div>
      )}

      {user.isDeleted && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-100 p-4 text-sm text-slate-700">
          <UserX className="size-4 shrink-0" aria-hidden />
          탈퇴한 회원입니다. (탈퇴일 {formatDateTime(user.deletedAt)})
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-4">
          <Tabs tabs={DETAIL_TABS} value={tab} onChange={setTab} />
          {tab === 'profile' && <UserProfilePanel user={user} />}
          {tab === 'sanctions' && (
            <SanctionsPanel
              userId={user.userId}
              hasActiveSuspension={user.activeSuspension !== null}
            />
          )}
          {tab === 'notifications' && (
            <UserNotificationsPanel userId={user.userId} />
          )}
        </div>
        <div>
          <UserActionsCard key={user.status} user={user} />
        </div>
      </div>
    </div>
  );
};
