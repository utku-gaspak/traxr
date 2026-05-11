import { createContext, useEffect, useState, useContext } from "react";
import type { ReactNode } from "react";
import { AUTH_TOKEN_CLEARED_EVENT } from "../authEvents";

interface AuthContextType {
  token: string | null;
  isLoggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Read the persisted token during the initial render so auth state survives refreshes.
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  useEffect(() => {
    // Interceptors can clear auth without going through this provider, so keep same-tab logout in sync here.
    const handleTokenCleared = () => {
      setToken(null);
    };

    window.addEventListener(AUTH_TOKEN_CLEARED_EVENT, handleTokenCleared);
    return () => {
      window.removeEventListener(AUTH_TOKEN_CLEARED_EVENT, handleTokenCleared);
    };
  }, []);

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  const value = {
    token,
    isLoggedIn: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
