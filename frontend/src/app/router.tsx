import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router';

import type { UserAccess } from '@/app/providers/auth-context';
import { RootError } from '@/app/error/RootError';
import { RootLayout } from '@/app/layouts/RootLayout';
import { RootLoading } from '@/app/loading/RootLoading';
import {
  bandPerformanceTabs,
  createHeaderConfig,
  resolveBandDetailHeader,
  resolvePerformanceHeader,
  withHeader,
} from '@/widgets/page-header';
import { AdminPage } from '@/pages/admin/AdminPage';
import { BandDetailPage } from '@/pages/band/BandDetailPage';
import { BandInvitePage } from '@/pages/band/BandInvitePage';
import { BandPerformancePage } from '@/pages/band/BandPerformancePage';
import { BandSettingsPage } from '@/pages/band/BandSettingsPage';
import { MyBandsPage } from '@/pages/band/MyBandsPage';
import { InviteAcceptPage } from '@/pages/invite/InviteAcceptPage';
import { InviteRequestPage } from '@/pages/invite/InviteRequestPage';
import { PerformanceCreatePage } from '@/pages/performance/PerformanceCreatePage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { SongTeamsPage } from '@/pages/song/SongTeamsPage';
import { SongsPage } from '@/pages/song/SongsPage';
import { TeamDetailPage } from '@/pages/team/TeamDetailPage';

export type RouterContext = {
  user: UserAccess;
};

type UserGuardPredicate = (user: UserAccess) => boolean;

const syncAuthenticatedUser = async (user: UserAccess): Promise<UserAccess> => {
  return user;
};

const createUserGuard = (predicate: UserGuardPredicate) => {
  return ({ context }: { context: RouterContext }) => {
    if (!predicate(context.user)) throw redirect({ to: '/' });
  };
};

const requireLogin = createUserGuard((user) => user.isLoggedIn);
const requireAdmin = createUserGuard((user) => user.isAdmin);
//TODO: 밴드 접근 권한 체크 로직 추가 필요
const allowBandAccess = createUserGuard(() => true);

/* ------------------------------------------------------------------ */
/*  Root Route
/*  전역 로딩, 에러 상태 관리                                             */
/* ------------------------------------------------------------------ */

const rootRoute = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => {
    context.user = await syncAuthenticatedUser(context.user);
  },
  component: RootLayout,
  pendingComponent: RootLoading,
  errorComponent: RootError,
});

/* ------------------------------------------------------------------ */
/*  App Routes (Top Level)                                             */
/* ------------------------------------------------------------------ */

const myBandsRoute = createRoute({
  ...withHeader(
    {
      getParentRoute: () => rootRoute,
      path: '/',
      component: MyBandsPage,
    },
    createHeaderConfig({
      title: '서비스명',
      showBack: false,
      showSearchBar: true,
    }),
  ),
});

const profileRoute = createRoute({
  ...withHeader(
    {
      getParentRoute: () => rootRoute,
      path: '/profile',
      beforeLoad: requireLogin,
      component: ProfilePage,
    },
    createHeaderConfig({
      title: '마이페이지',
      subtitle: '내 프로필 정보를 관리하세요',
      rightActionLabel: '수정',
      backBehavior: 'browser',
      showProfileAvatar: false,
    }),
  ),
});

const songTeamsRoute = createRoute({
  ...withHeader(
    {
      getParentRoute: () => rootRoute,
      path: '/song/$songId/teams',
      component: SongTeamsPage,
    },
    createHeaderConfig({
      title: '팀 목록',
    }),
  ),
});

const teamDetailRoute = createRoute({
  ...withHeader(
    {
      getParentRoute: () => rootRoute,
      path: '/song/$songId/team/$teamId',
      component: TeamDetailPage,
    },
    createHeaderConfig({
      title: '팀 상세',
      backTo: '/song/$songId/teams',
      getBackParams: (params: Record<string, string>) => ({
        songId: params.songId,
      }),
    }),
  ),
});

/* ------------------------------------------------------------------ */
/*  Band Routes (Grouped)                                              */
/* ------------------------------------------------------------------ */

const bandRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/band/$bandId',
  beforeLoad: allowBandAccess,
});

const bandDetailRoute = createRoute({
  ...withHeader(
    {
      getParentRoute: () => bandRoute,
      path: '/',
      component: BandDetailPage,
    },
    createHeaderConfig({
      title: '밴드',
      brandLabel: '밴드',
      backTo: '/',
      rightActionLabel: '밴드 설정',
      rightActionTo: '/band/$bandId/settings',
      getRightActionParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
      resolve: resolveBandDetailHeader,
    }),
  ),
});

const bandSettingsRoute = createRoute({
  ...withHeader(
    {
      getParentRoute: () => bandRoute,
      path: 'settings',
      component: BandSettingsPage,
    },
    createHeaderConfig({
      title: '밴드 설정',
      backTo: '/',
    }),
  ),
});

const bandInviteRoute = createRoute({
  ...withHeader(
    {
      getParentRoute: () => bandRoute,
      path: 'invite',
      component: BandInvitePage,
    },
    createHeaderConfig({
      title: '밴드 초대',
      backTo: '/',
    }),
  ),
});

const bandPerformanceRoute = createRoute({
  ...withHeader(
    {
      getParentRoute: () => bandRoute,
      path: 'performance/$performanceId',
      component: BandPerformancePage,
    },
    createHeaderConfig({
      title: '공연 상세',
      backTo: '/band/$bandId',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
      tabs: bandPerformanceTabs,
      rightActionLabel: '설정',
      rightActionTo: '/band/$bandId/settings',
      getRightActionParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
      resolve: resolvePerformanceHeader,
    }),
  ),
});

const bandPerformanceSongsRoute = createRoute({
  ...withHeader(
    {
      getParentRoute: () => bandRoute,
      path: 'performance/$performanceId/songs',
      component: SongsPage,
    },
    createHeaderConfig({
      title: '공연 상세',
      backTo: '/band/$bandId',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
      tabs: bandPerformanceTabs,
      rightActionLabel: '설정',
      rightActionTo: '/band/$bandId/settings',
      getRightActionParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
      resolve: resolvePerformanceHeader,
    }),
  ),
});

/* ------------------------------------------------------------------ */
/*  Performance / Invite                                               */
/* ------------------------------------------------------------------ */

const performanceCreateRoute = createRoute({
  ...withHeader(
    {
      getParentRoute: () => rootRoute,
      path: '/performance/create',
      component: PerformanceCreatePage,
    },
    createHeaderConfig({
      title: '공연 생성',
    }),
  ),
});

const inviteAcceptRoute = createRoute({
  ...withHeader(
    {
      getParentRoute: () => rootRoute,
      path: '/invite/accept',
      component: InviteAcceptPage,
    },
    createHeaderConfig({
      title: '초대 수락',
      showProfileAvatar: false,
    }),
  ),
});

const inviteRequestRoute = createRoute({
  ...withHeader(
    {
      getParentRoute: () => rootRoute,
      path: '/invite/request',
      component: InviteRequestPage,
    },
    createHeaderConfig({
      title: '초대 요청',
    }),
  ),
});

/* ------------------------------------------------------------------ */
/*  Admin                                                             */
/* ------------------------------------------------------------------ */

const adminRoute = createRoute({
  ...withHeader(
    {
      getParentRoute: () => rootRoute,
      path: '/admin',
      beforeLoad: requireAdmin,
      component: AdminPage,
    },
    createHeaderConfig({
      title: '관리자',
    }),
  ),
});

/* ------------------------------------------------------------------ */
/*  Route Tree                                                         */
/* ------------------------------------------------------------------ */

export const routeTree = rootRoute.addChildren([
  myBandsRoute,
  profileRoute,
  songTeamsRoute,
  teamDetailRoute,

  bandRoute.addChildren([
    bandDetailRoute,
    bandSettingsRoute,
    bandInviteRoute,
    bandPerformanceRoute,
    bandPerformanceSongsRoute,
  ]),

  performanceCreateRoute,
  inviteAcceptRoute,
  inviteRequestRoute,
  adminRoute,
]);

/* ------------------------------------------------------------------ */
/*  Router Instance                                                    */
/* ------------------------------------------------------------------ */

export const createAppRouter = () => {
  return createRouter({
    routeTree,
    context: {} as RouterContext,
    defaultPendingMinMs: 150,
  });
};

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
