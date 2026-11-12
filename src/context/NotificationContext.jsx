import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { io } from "socket.io-client";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";

const NotificationContext = createContext(null);

const SOCKET_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? window.location.origin
    : "https://clientportalapi.hawkntechnologies.com");

export function NotificationProvider({ enabled, children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled) return;

    try {
      const data = await fetchNotifications({ limit: 50 });
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
      let wasAdded = false;

      setNotifications((current) => {
        if (current.some((item) => item.id === notification.id)) {
          return current;
        }

        wasAdded = true;
        return [notification, ...current].slice(0, 50);
      });

      if (wasAdded && !notification.readAt) {
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