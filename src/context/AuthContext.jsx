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
  const [availableModes, setAvailableModes] = useState([]);
  const [activeMode, setActiveMode] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const loadModes = useCallback(async (fallbackRole) => {
    const res = await axios.get("/api/auth/me/modes", {
      withCredentials: true,
    });

    const modes = res.data.data.modes;
    const savedMode = sessionStorage.getItem("activeDashboardMode");

    const mode = modes.includes(savedMode)
      ? savedMode
      : modes.includes(fallbackRole)
        ? fallbackRole
        : (modes[0] ?? null);

    setAvailableModes(modes);
    setActiveMode(mode);

    return mode;
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get("/api/auth/me", {
          withCredentials: true,
        });

        const authenticatedUser = res.data.data.user;
        setUser(authenticatedUser);

        await loadModes(authenticatedUser.role?.name);
      } catch {
        setUser(null);
        setAvailableModes([]);
        setActiveMode(null);
        sessionStorage.removeItem("activeDashboardMode");
      } finally {
        setIsAuthenticating(false);
      }
    };

    checkSession();
  }, [loadModes]);

  const login = useCallback(
    async (credentials) => {
      setIsAuthenticating(true);

      try {
        const res = await axios.post("/api/auth/login", credentials, {
          withCredentials: true,
        });

        const authenticatedUser = res.data.data.user;
        setUser(authenticatedUser);

        await loadModes(authenticatedUser.role?.name);

        return authenticatedUser;
      } catch (error) {
        setUser(null);
        setAvailableModes([]);
        setActiveMode(null);
        throw error;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [loadModes],
  );

  const switchMode = useCallback(
    (mode) => {
      if (!availableModes.includes(mode)) {
        throw new Error("You are not authorized for this dashboard.");
      }

      setActiveMode(mode);
      sessionStorage.setItem("activeDashboardMode", mode);
    },
    [availableModes],
  );

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
      setAvailableModes([]);
      setActiveMode(null);
      sessionStorage.removeItem("activeDashboardMode");
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role?.name ?? null,
      availableModes,
      activeMode,
      switchMode,
      isAuthenticated: Boolean(user),
      isAuthenticating,
      login,
      logout,
    }),
    [
      user,
      availableModes,
      activeMode,
      switchMode,
      isAuthenticating,
      login,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
