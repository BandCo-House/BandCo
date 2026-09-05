import { useState, type ReactNode, useCallback, useMemo } from 'react';
import {
  AuthContext,
  type UserAccess,
  type AuthContextValue,
} from '@/app/providers/auth-context';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '@/shared/lib/auth-storage';
import { getUserIdFromToken, isTokenExpired } from '@/shared/lib/jwt';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserAccess>(() => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    const userId = getUserIdFromToken(accessToken);
    const isAccessExpired = isTokenExpired(accessToken);
    const isRefreshExpired = isTokenExpired(refreshToken);

    const isAccessInvalid = !accessToken || isAccessExpired;
    const isRefreshInvalid = !refreshToken || isRefreshExpired;

    if (
      isAccessInvalid &&
      isRefreshInvalid &&
      (Boolean(accessToken) || Boolean(refreshToken))
    ) {
      clearTokens();
    }

    const isLoggedIn =
      !!userId && (!isAccessExpired || (!!refreshToken && !isRefreshExpired));

    return {
      isLoggedIn,
      isAdmin: false,
      id: isLoggedIn ? userId : null,
    };
  });

  const login = useCallback((accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken);
    const userId = getUserIdFromToken(accessToken);
    setUser({
      isLoggedIn: !!userId,
      isAdmin: false,
      id: userId,
    });
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser({ isLoggedIn: false, isAdmin: false, id: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login,
      logout,
    }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
