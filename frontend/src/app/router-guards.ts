import { redirect, type ParsedLocation } from '@tanstack/react-router';
import type { UserAccess } from '@/app/providers/auth-context';
import { getAccessToken, getRefreshToken } from '@/shared/lib/auth-storage';
import { getUserIdFromToken, isTokenExpired } from '@/shared/lib/jwt';

export type RouterContext = {
  user: UserAccess;
  logout: () => void;
};

type UserGuardPredicate = (user: UserAccess) => boolean;

const PUBLIC_ONLY_PATHS = new Set(['/login', '/signup', '/forgot-password']);

/**
 * 로그인/회원가입의 `?redirect=` 값 검증. 내부 경로만 통과시킨다.
 * '//evil.com'(프로토콜 상대 URL)과 '/\evil.com'(브라우저가 //로 정규화)은
 * startsWith('/')를 통과하므로 명시적으로 걸러야 오픈 리다이렉트가 막힌다.
 */
export const sanitizeRedirectSearch = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  if (!value.startsWith('/')) return undefined;
  if (value.startsWith('//') || value.startsWith('/\\')) return undefined;
  return value;
};

/**
 * 라우터 진입 전 사용자 상태 동기화 지점.
 * login()은 토큰을 저장소에 동기로 쓰지만 컨텍스트 반영은 React 재렌더 뒤라,
 * 로그인/가입 직후의 navigate는 가드가 옛 상태(비로그인)로 판정하는 레이스가 있다
 * (회원가입 → 온보딩 진입이 홈으로 튕기던 원인). 저장소를 진실로 삼아 보정한다.
 */
export const syncAuthenticatedUser = async (
  user: UserAccess,
): Promise<UserAccess> => {
  if (user.isLoggedIn) return user;

  // 판정 규칙은 AuthProvider 초기화와 동일해야 한다: 액세스가 유효하거나,
  // 만료됐어도 리프레시가 살아 있으면 로그인으로 본다. 액세스만 보면
  // 리프레시로 연장 가능한 세션(만료 직후 새로고침 등)을 비로그인 취급한다.
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  const userId = getUserIdFromToken(accessToken);
  const isLoggedIn =
    !!userId &&
    (!isTokenExpired(accessToken) ||
      (!!refreshToken && !isTokenExpired(refreshToken)));

  if (isLoggedIn) {
    return { isLoggedIn: true, isAdmin: user.isAdmin, id: userId };
  }

  return user;
};

/**
 * 로그인 없이 접근 가능한 공개 경로인지 확인한다.
 */
export const isPublicGuestPath = (location: ParsedLocation): boolean => {
  const { pathname, search } = location;

  // 초대 링크 랜딩은 로그인 없이 볼 수 있어야 한다. 로그인 유도는 수락 버튼에서 한다.
  if (pathname.startsWith('/invite/')) {
    return true;
  }

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
    // 원래 가려던 경로를 들고 가서 로그인 후 되돌아온다.
    // 초대 링크(/invite/{code})처럼 비로그인 상태로 진입하는 딥링크가 살아남는 핵심.
    throw redirect({
      to: '/login',
      search: {
        redirect: location.pathname === '/' ? undefined : location.href,
      },
    });
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
