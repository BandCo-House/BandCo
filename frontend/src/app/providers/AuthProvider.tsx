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

const getUserIdFromToken = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    );
    const jsonPayload = decodeURIComponent(
      window
        .atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const payload = JSON.parse(jsonPayload) as { id?: unknown };
    return typeof payload.id === 'string' ? payload.id : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserAccess>(() => {
    const token = getAccessToken();
    return {
      isLoggedIn: !!token,
      isAdmin: false,
      id: getUserIdFromToken(token),
    };
  });

  const login = useCallback((accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken);
    setUser({
      isLoggedIn: true,
      isAdmin: false,
      id: getUserIdFromToken(accessToken),
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
