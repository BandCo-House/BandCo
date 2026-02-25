import { redirect } from '@tanstack/react-router';
import type { UserAccess } from '@/app/providers/auth-context';

export type RouterContext = {
  user: UserAccess;
};

type UserGuardPredicate = (user: UserAccess) => boolean;

/**
 * 라우터 진입 전 사용자 상태 동기화 지점
 * 현재는 AuthProvider의 값을 그대로 사용하고, 추후 토큰 재검증/권한 동기화 로직을 붙일 수 있다.
 */
export const syncAuthenticatedUser = async (user: UserAccess): Promise<UserAccess> => {
  return user;
};

/**
 * 사용자 접근 조건을 공통 가드 함수로 생성한다.
 * 조건을 통과하지 못하면 루트 경로로 리다이렉트한다.
 */
const createUserGuard = (predicate: UserGuardPredicate) => {
  return ({ context }: { context: RouterContext }) => {
    if (!predicate(context.user)) {
      throw redirect({ to: '/' });
    }
  };
};

/** 로그인 사용자만 접근 가능 */
export const requireLogin = createUserGuard((user) => user.isLoggedIn);

/** 관리자 사용자만 접근 가능 */
export const requireAdmin = createUserGuard((user) => user.isAdmin);

/**
 * 밴드 접근 권한 가드
 * TODO: bandId 기준 실제 권한 검증 로직으로 교체 필요
 */
export const allowBandAccess = createUserGuard(() => true);
