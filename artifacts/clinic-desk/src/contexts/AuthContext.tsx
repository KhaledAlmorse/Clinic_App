import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, useLogin, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "patient" | "receptionist" | "doctor" | "admin";
  specialty: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("clinic_token"));
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const login = async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ data: { email, password } });
    localStorage.setItem("clinic_token", result.token);
    setToken(result.token);
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {}
    localStorage.removeItem("clinic_token");
    setToken(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{
      user: (user as User) ?? null,
      isLoading: !!token && isLoading,
      login,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
