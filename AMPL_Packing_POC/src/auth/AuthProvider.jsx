import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCsrf, fetchMe, postLogin, postLogout } from "../api/auth";
import { SESSION_EXPIRED_EVENT } from "../api/client";
import { AuthContext } from "./AuthContext";

/**
 * Holds who is logged in.
 * status: "loading" | "authenticated" | "anonymous" | "error"
 */
export default function AuthProvider({ children }) {
  const [state, setState] = useState({ status: "loading", user: null, error: null });

  const refresh = useCallback(async () => {
    try {
      const user = await fetchMe();
      setState({ status: "authenticated", user, error: null });
      return user;
    } catch (error) {
      if (error.status === 401) {
        setState({ status: "anonymous", user: null, error: null });
      } else {
        setState({ status: "error", user: null, error });
      }
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchCsrf(); // sets the CSRF cookie needed for login/logout
      } catch {
        // fetchMe below reports the problem
      }
      if (!cancelled) await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  // Session ended while using the app: go back to sign-in (RequireAuth redirects).
  useEffect(() => {
    const handleExpired = () =>
      setState((prev) =>
        prev.status === "authenticated" ? { status: "anonymous", user: null, error: null, expired: true } : prev,
      );
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  const login = useCallback(async (username, password) => {
    await fetchCsrf();
    const user = await postLogin(username, password);
    setState({ status: "authenticated", user, error: null });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await postLogout();
    } finally {
      setState({ status: "anonymous", user: null, error: null });
    }
  }, []);

  const value = useMemo(
    () => ({ ...state, login, logout, refresh }),
    [state, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
