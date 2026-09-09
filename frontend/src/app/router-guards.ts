import { redirect, type ParsedLocation } from '@tanstack/react-router';
import type { UserAccess } from '@/app/providers/auth-context';
import { getAccessToken } from '@/shared/lib/auth-storage';
import { getUserIdFromToken, isTokenExpired } from '@/shared/lib/jwt';

export type RouterContext = {
  user: UserAccess;
  logout: () => void;
};

type UserGuardPredicate = (user: UserAccess) => boolean;

const PUBLIC_ONLY_PATHS = new Set(['/login', '/signup', '/forgot-password']);

/**
 * 라우터 진입 전 사용자 상태 동기화 지점
 *
 * 로그인 직후에는 AuthProvider의 상태 변경이 아직 라우터 컨텍스트에 반영되지 않은 채로
 * 첫 이동이 일어난다. 그때 컨텍스트만 믿으면 방금 로그인한 사용자를 로그인 화면으로 되돌리게 되므로,
 * 컨텍스트가 비로그인일 때만 저장된 토큰을 확인해 보정한다.
 */
export const syncAuthenticatedUser = async (
  user: UserAccess,
): Promise<UserAccess> => {
  if (user.isLoggedIn) {
    return user;
  }

  const accessToken = getAccessToken();

  if (!accessToken || isTokenExpired(accessToken)) {
    return user;
  }

  const id = getUserIdFromToken(accessToken);

  return id ? { ...user, isLoggedIn: true, id } : user;
};

/**
 * 로그인 없이 접근 가능한 공개 경로인지 확인한다.
 */
export const isPublicGuestPath = (location: ParsedLocation): boolean => {
  const { pathname, search } = location;

  // 프로필 페이지이면서 검색 파라미터에 userId가 존재하는 경우 (방문자 모드) 예외 허용
  const searchObj = (search ?? {}) as Record<string, unknown>;
  if (
    pathname === '/profile' &&
    Object.prototype.hasOwnProperty.call(searchObj, 'userId')
  ) {
    return true;
  }

  return PUBLIC_ONLY_PATHS.has(pathname);
};

/**
 * 게스트 전용 경로를 제외한 모든 페이지에 로그인 요구 조건을 적용한다.
 */
export const enforceProtectedRoute = ({
  context,
  location,
}: {
  context: RouterContext;
  location: ParsedLocation;
}) => {
  if (!context.user.isLoggedIn && !isPublicGuestPath(location)) {
    throw redirect({ to: '/login' });
  }
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

/** 비로그인 사용자만 접근 가능 (로그인/회원가입 페이지용) */
export const requireGuest = createUserGuard((user) => !user.isLoggedIn);

/** 관리자 사용자만 접근 가능 */
export const requireAdmin = createUserGuard((user) => user.isAdmin);

/**
 * 밴드 접근 권한 가드
 * TODO: bandId 기준 실제 권한 검증 로직으로 교체 필요
 */
export const allowBandAccess = createUserGuard(() => true);
