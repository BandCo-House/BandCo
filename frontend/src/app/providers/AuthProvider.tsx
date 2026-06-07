import { useState, type ReactNode, useCallback, useMemo } from 'react';
import {
  AuthContext,
  type UserAccess,
  type AuthContextValue,
} from '@/app/providers/auth-context';
import {
  getAccessToken,
  setTokens,
  clearTokens,
} from '@/shared/lib/auth-storage';
import { getUserIdFromToken } from '@/shared/lib/jwt';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserAccess>(() => {
    const token = getAccessToken();
    const userId = getUserIdFromToken(token);
    return {
      isLoggedIn: !!userId,
      isAdmin: false,
      id: userId,
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
