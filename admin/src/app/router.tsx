import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router';

import { AdminsPage } from '@/pages/AdminsPage';
import { AnnouncementsPage } from '@/pages/AnnouncementsPage';
import { AuditLogsPage } from '@/pages/AuditLogsPage';
import { BandDetailPage } from '@/pages/BandDetailPage';
import { BandsPage } from '@/pages/BandsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { MasterDataPage } from '@/pages/MasterDataPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { UserDetailPage } from '@/pages/UserDetailPage';
import { UsersPage } from '@/pages/UsersPage';
import { hasSession } from '@/shared/lib/auth-storage';

import { AppLayout } from './layout/AppLayout';
import {
  validateAuditLogSearch,
  validateBandListSearch,
  validateLoginSearch,
  validateReportListSearch,
  validateUserListSearch,
} from './search';

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFoundPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: validateLoginSearch,
  beforeLoad: () => {
    if (hasSession()) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

// 로그인한 어드민만 들어오는 레이아웃. 토큰이 없으면 로그인 화면으로 보낸다.
const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_auth',
  beforeLoad: ({ location }) => {
    if (!hasSession()) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
  },
  component: AppLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/',
  component: DashboardPage,
});

const usersRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/users',
  validateSearch: validateUserListSearch,
  component: UsersPage,
});

const userDetailRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/users/$userId',
  component: UserDetailPage,
});

const bandsRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/bands',
  validateSearch: validateBandListSearch,
  component: BandsPage,
});

const bandDetailRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/bands/$bandId',
  component: BandDetailPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/reports',
  validateSearch: validateReportListSearch,
  component: ReportsPage,
});

const masterDataRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/master-data',
  component: MasterDataPage,
});

const announcementsRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/announcements',
  component: AnnouncementsPage,
});

const notificationsRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/notifications',
  component: NotificationsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/settings',
  component: SettingsPage,
});

const auditLogsRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/audit-logs',
  validateSearch: validateAuditLogSearch,
  component: AuditLogsPage,
});

const adminsRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/admins',
  component: AdminsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  authRoute.addChildren([
    dashboardRoute,
    usersRoute,
    userDetailRoute,
    bandsRoute,
    bandDetailRoute,
    reportsRoute,
    masterDataRoute,
    announcementsRoute,
    notificationsRoute,
    settingsRoute,
    auditLogsRoute,
    adminsRoute,
  ]),
]);

// 서비스 도메인의 /admin 아래에서 동작하므로 라우트 경로는 /admin을 뺀 값으로 쓴다.
export const router = createRouter({ routeTree, basepath: '/admin' });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
