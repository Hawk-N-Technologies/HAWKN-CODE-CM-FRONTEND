import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";

const NotificationContext = createContext(null);

// The login cookie belongs to the portal's own address (the API is reached
// through the /api proxy), so live updates connect through the same address
// — nginx forwards /socket.io to the API. VITE_API_URL can still override.
const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;

export function NotificationProvider({ enabled, children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");
  // Ids already in the list — decides (synchronously) whether a live
  // notification is new, so the unread badge goes up exactly once
  const knownIdsRef = useRef(new Set());

  const refresh = useCallback(async () => {
    if (!enabled) return;

    try {
      const data = await fetchNotifications({ limit: 50 });
      knownIdsRef.current = new Set(data.notifications.map((item) => item.id));
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setError("");
      return undefined;
    }

    let active = true;

    const load = async () => {
      try {
        const data = await fetchNotifications({ limit: 50 });

        if (!active) return;

        knownIdsRef.current = new Set(data.notifications.map((item) => item.id));
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setError("");
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message || "Unable to load notifications.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    setLoading(true);
    load();

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("notification:new", (notification) => {
      // Already showing it (e.g. it arrived again after a reconnect) → ignore
      if (knownIdsRef.current.has(notification.id)) return;
      knownIdsRef.current.add(notification.id);

      setNotifications((current) => [notification, ...current].slice(0, 50));

      if (!notification.readAt) {
        setUnreadCount((count) => count + 1);
      }
    });

    socket.on("connect", () => {
      // Recover notifications created while this browser was disconnected.
      load();
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [enabled]);

  const markRead = useCallback(async (id) => {
    const current = notifications.find((item) => item.id === id);

    if (!current || current.readAt) return;

    const updated = await markNotificationRead(id);

    setNotifications((items) =>
      items.map((item) => (item.id === id ? updated : item)),
    );

    setUnreadCount((count) => Math.max(0, count - 1));
  }, [notifications]);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();

    const now = new Date().toISOString();

    setNotifications((items) =>
      items.map((item) => item.readAt ? item : { ...item, readAt: now }),
    );

    setUnreadCount(0);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      refresh,
      markRead,
      markAllRead,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      refresh,
      markRead,
      markAllRead,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider.",
    );
  }

  return context;
}