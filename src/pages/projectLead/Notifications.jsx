
import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import axios from "axios";

export default function ProjectLeadNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get("/api/notifications", {
        withCredentials: true,
      });

      setItems(response.data.data ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Could not load notifications. Check the backend and sign-in session.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function markRead(id) {
    try {
      await axios.patch(
        `/api/notifications/${id}/read`,
        {},
        { withCredentials: true },
      );

      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, read: true } : item,
        ),
      );
    } catch {
      setError("Could not mark this notification as read.");
    }
  }

  async function markAllRead() {
    try {
      await axios.patch(
        "/api/notifications/read-all",
        {},
        { withCredentials: true },
      );

      setItems((current) => current.map((item) => ({ ...item, read: true })));
    } catch {
      setError("Could not mark notifications as read.");
    }
  }

  const unreadCount = items.filter((item) => !item.read).length;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-cm-text">
            <Bell aria-hidden="true" size={22} />
            Notifications
          </h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Project planning, team, phase and task updates.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadNotifications}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={16} className="mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-cm-md border border-red-300 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-cm-text-muted">Loading notifications…</p>
      ) : items.length === 0 ? (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card p-8 text-center">
          <Bell className="mx-auto mb-3 text-cm-text-muted" size={28} />
          <p className="font-medium text-cm-text">You're all caught up</p>
          <p className="mt-1 text-sm text-cm-text-muted">
            New project notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-cm-text">
                      {item.title}
                    </h2>
                    <Badge tone={item.read ? "neutral" : "info"}>
                      {item.read ? "Read" : "Unread"}
                    </Badge>
                    <Badge tone="neutral">{item.type}</Badge>
                  </div>

                  <p className="mt-2 text-sm text-cm-text-muted">
                    {item.message}
                  </p>
                  <p className="mt-2 text-xs text-cm-text-muted">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : ""}
                  </p>
                </div>

                {!item.read && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markRead(item.id)}
                  >
                    Mark Read
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
