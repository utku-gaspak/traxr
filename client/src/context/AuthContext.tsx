import { createContext, useState, useContext } from "react";
import type { ReactNode } from "react"; // 'type' anahtar kelimesini ekledik
// 1. Context'in şeklini belirleyelim
interface AuthContextType {
  token: string | null;
  isLoggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
}

// 2. Boş bir context oluşturuyoruz
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Sağlayıcı (Provider) bileşenimiz
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // İlk açılışta localStorage'a bakıyoruz (Hydration)
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

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
    isLoggedIn: !!token, // Token varsa true, yoksa false
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 4. Custom Hook: Diğer bileşenlerde kullanırken kolaylık sağlar
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
