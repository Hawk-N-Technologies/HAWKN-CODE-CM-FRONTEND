import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as authService from "../services/authService";

const STORAGE_KEY = "cm.auth.user";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(undefined);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Corrupt/blocked storage should never crash the app.
    return null;
  }
}

/**
 * Holds only non-sensitive session info (id, name, email, role) — never
 * a password or a real auth token. Once a real backend issues a proper
 * session (ideally a secure, HttpOnly cookie), this becomes the place
 * that reflects that session, not the place that manages secrets.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = useCallback(async (credentials) => {
    setIsAuthenticating(true);
    try {
      const authenticatedUser = await authService.login(credentials);
      setUser(authenticatedUser);
      return authenticatedUser;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      isAuthenticating,
      login,
      logout,
    }),
    [user, isAuthenticating, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;