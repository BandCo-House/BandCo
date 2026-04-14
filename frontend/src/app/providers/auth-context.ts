import { createContext, useContext } from "react";

export type UserAccess = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  // 추후 필요한 유저 정보 추가 가능
};

export interface AuthContextValue {
  user: UserAccess;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");

  return context;
};
