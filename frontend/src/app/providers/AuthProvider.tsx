import { useState, type ReactNode, useCallback, useMemo } from "react";
import { AuthContext, type UserAccess, type AuthContextValue } from "@/app/providers/auth-context";
import { getAccessToken, setTokens, clearTokens } from "@/shared/lib/auth-storage";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserAccess>(() => ({
    isLoggedIn: !!getAccessToken(),
    isAdmin: false, // 추후 토큰 디코딩 등으로 판단 가능
  }));

  const login = useCallback((accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken);
    setUser({ isLoggedIn: true, isAdmin: false });
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser({ isLoggedIn: false, isAdmin: false });
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
