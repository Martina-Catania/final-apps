import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  currentUserRequest,
  loginRequest,
  registerRequest,
  type AuthUser,
  type RegisterInput,
} from "../utils/auth-api";

const TOKEN_STORAGE_KEY = "recapify.auth.token";
const USER_STORAGE_KEY = "recapify.auth.user";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function persistSession(token: string, user: AuthUser) {
  await AsyncStorage.multiSet([
    [TOKEN_STORAGE_KEY, token],
    [USER_STORAGE_KEY, JSON.stringify(user)],
  ]);
}

async function clearStoredSession() {
  await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const bootstrapSession = useCallback(async () => {
    try {
      const storedValues = await AsyncStorage.multiGet([
        TOKEN_STORAGE_KEY,
        USER_STORAGE_KEY,
      ]);
      const storedToken =
        storedValues.find(([key]) => key === TOKEN_STORAGE_KEY)?.[1] ?? null;

      if (!storedToken) {
        setUser(null);
        setToken(null);
        return;
      }

      const current = await currentUserRequest(storedToken);
      setToken(storedToken);
      setUser(current.user);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(current.user));
    } catch {
      setUser(null);
      setToken(null);
      await clearStoredSession();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);

  const login = useCallback(async (email: string, password: string) => {
    const payload = await loginRequest(email, password);
    setToken(payload.token);
    setUser(payload.user);
    await persistSession(payload.token, payload.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const payload = await registerRequest(input);
    setToken(payload.token);
    setUser(payload.user);
    await persistSession(payload.token, payload.user);
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await clearStoredSession();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [isLoading, login, logout, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return value;
}