import { createRootRouteWithContext } from '@tanstack/react-router';
import { RootError } from '@/app/states/RootError';
import { RootLayout } from '@/app/layouts/RootLayout';
import { RootLoading } from '@/app/states/RootLoading';
import type { RouterContext } from '@/app/router-guards';
import {
  enforceProtectedRoute,
  syncAuthenticatedUser,
} from '@/app/router-guards';

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context, location }) => {
    // 앱 시작/새로고침 시점에 사용자 컨텍스트를 한 번 동기화한다.
    // 반환값이 자식 매치 컨텍스트로 병합된다 — 대입(context.user = …)만 하면
    // 자식 가드(requireLogin 등)는 동기화 전 user를 봐서, 로그인 직후의
    // 보호 라우트 진입(가입 → 온보딩)이 홈으로 튕긴다.
    const user = await syncAuthenticatedUser(context.user);
    enforceProtectedRoute({ context: { ...context, user }, location });
    return { user };
  },
  component: RootLayout,
  pendingComponent: RootLoading,
  errorComponent: RootError,
});
