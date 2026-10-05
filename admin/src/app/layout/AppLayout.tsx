import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import {
  Flag,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Music,
  ScrollText,
  Send,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { useCurrentAdmin } from '@/features/auth/api';
import { AdminRoleBadge } from '@/features/auth/components/AdminRoleBadge';
import { ChangePasswordModal } from '@/features/auth/components/ChangePasswordModal';
import { clearTokens } from '@/shared/lib/auth-storage';
import { Button } from '@/shared/ui/Button';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';

interface NavItem {
  to:
    | '/'
    | '/users'
    | '/bands'
    | '/reports'
    | '/master-data'
    | '/announcements'
    | '/notifications'
    | '/settings'
    | '/audit-logs'
    | '/admins';
  label: string;
  icon: LucideIcon;
  superOnly?: boolean;
}

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: '/', label: '대시보드', icon: LayoutDashboard },
  { to: '/users', label: '회원', icon: Users },
  { to: '/bands', label: '밴드', icon: Music },
  { to: '/reports', label: '신고', icon: Flag },
  { to: '/master-data', label: '마스터 데이터', icon: Tags },
  { to: '/announcements', label: '공지', icon: Megaphone },
  { to: '/notifications', label: '알림 발송', icon: Send, superOnly: true },
  { to: '/settings', label: '서비스 설정', icon: Settings },
  { to: '/audit-logs', label: '감사 로그', icon: ScrollText },
  { to: '/admins', label: '어드민 계정', icon: ShieldCheck, superOnly: true },
];

export const AppLayout = () => {
  const { data: admin, isPending, isError, refetch } = useCurrentAdmin();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [passwordOpen, setPasswordOpen] = useState(false);

  const handleLogout = () => {
    clearTokens();
    queryClient.clear();
    void navigate({ to: '/login' });
  };

  if (isPending) {
    return <LoadingState label="계정 정보를 확인하는 중…" />;
  }

  if (isError || !admin) {
    return (
      <EmptyState
        title="계정 정보를 불러오지 못했습니다."
        action={
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" onClick={() => void refetch()}>
              다시 시도
            </Button>
            <Button onClick={handleLogout}>로그인 화면으로</Button>
          </div>
        }
      />
    );
  }

  const isSuperAdmin = admin.role === 'SUPER_ADMIN';
  const navItems = NAV_ITEMS.filter((item) => !item.superOnly || isSuperAdmin);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-14 items-center border-b border-slate-200 px-5">
          <span className="text-base font-bold text-slate-900">BandCo</span>
          <span className="ml-1.5 text-xs font-medium text-slate-500">
            어드민
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === '/' }}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              activeProps={{
                className: 'bg-slate-100 font-semibold text-slate-900',
              }}
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-3 border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
          <span className="text-sm font-medium text-slate-800">
            {admin.name}
          </span>
          <AdminRoleBadge role={admin.role} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPasswordOpen(true)}
          >
            <KeyRound className="size-4" aria-hidden />
            비밀번호 변경
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" aria-hidden />
            로그아웃
          </Button>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>

      <ChangePasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      />
    </div>
  );
};
