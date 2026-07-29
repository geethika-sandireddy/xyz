import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useGetMe, useSignup, useLogin, useLogout, type AuthUser as ApiAuthUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type AuthUser = ApiAuthUser | null;

type AuthContextValue = {
  user: AuthUser;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const me = useGetMe();

  useEffect(() => {
    if (me.isSuccess) {
      setUser(me.data.user ?? null);
      setLoading(false);
    }
    if (me.isError) {
      setLoading(false);
    }
  }, [me.isSuccess, me.isError, me.data]);

  const signupMutation = useSignup();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const signup = async (email: string, password: string) => {
    const result = await signupMutation.mutateAsync({ data: { email, password } });
    setUser(result);
    queryClient.invalidateQueries();
  };

  const login = async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ data: { email, password } });
    setUser(result);
    queryClient.invalidateQueries();
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    setUser(null);
    queryClient.invalidateQueries();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth has to be used inside AuthProvider");
  }
  return ctx;
}
