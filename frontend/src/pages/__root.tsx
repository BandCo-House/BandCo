import { createRootRouteWithContext } from '@tanstack/react-router';
import { RootError } from '@/app/states/RootError';
import { RootLayout } from '@/app/layouts/RootLayout';
import { RootLoading } from '@/app/states/RootLoading';
import type { RouterContext } from '@/app/router-guards';
import { enforceProtectedRoute, syncAuthenticatedUser } from '@/app/router-guards';

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context, location }) => {
    // 앱 시작/새로고침 시점에 사용자 컨텍스트를 한 번 동기화한다.
    context.user = await syncAuthenticatedUser(context.user);
    enforceProtectedRoute({ context, pathname: location.pathname });
  },
  component: RootLayout,
  pendingComponent: RootLoading,
  errorComponent: RootError,
});
