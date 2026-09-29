import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";

export const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  // Check existing session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get("/api/auth/me", {
          withCredentials: true,
        });

        setUser(res.data.data.user);
      } catch {
        setUser(null);
      } finally {
        setIsAuthenticating(false);
      }
    };

    checkSession();
  }, []);

  // Login
  const login = useCallback(async (credentials) => {
    setIsAuthenticating(true);

    try {
      const res = await axios.post("/api/auth/login", credentials, {
        withCredentials: true,
      });

      const authenticatedUser = res.data.data.user;

      setUser(authenticatedUser);

      return authenticatedUser;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await axios.post(
        "/api/auth/logout",
        {},
        {
          withCredentials: true,
        },
      );
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role?.name ?? null,
      isAuthenticated: Boolean(user),
      isAuthenticating,
      login,
      logout,
    }),
    [user, isAuthenticating, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
