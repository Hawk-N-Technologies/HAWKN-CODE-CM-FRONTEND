import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import TableSearch from "../../components/tables/TableSearch";
import { useNotifications } from "../../context/NotificationContext";
import { createTestNotification } from "../../services/notificationService";

const FILTERS = ["All", "Unread", "BRD_SUBMITTED", "SYSTEM_TEST"];

function formatTime(value) {
  if (!value) return "Time unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Time unavailable";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
  } = useNotifications();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [actionError, setActionError] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((item) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Unread" ? !item.readAt : item.type === filter);

      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [notifications, search, filter]);

  async function handleMarkRead(id) {
    try {
      setActionError("");
      await markRead(id);
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Could not mark notification as read.",
      );
    }
  }

  async function handleMarkAllRead() {
    try {
      setActionError("");
      await markAllRead();
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Could not mark notifications as read.",
      );
    }
  }

  async function handleTestNotification() {
    try {
      setTestLoading(true);
      setActionError("");
      await createTestNotification();
      await refresh();
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Could not create the test notification.",
      );
    } finally {
      setTestLoading(false);
    }
  }

  function openNotification(item) {
    if (!item.readAt) {
      handleMarkRead(item.id).catch(() => {});
    }

    if (
      typeof item.link === "string" &&
      item.link.startsWith("/admin/")
    ) {
      navigate(item.link);
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-cm-border pb-5">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cm-primary">
            Admin activity
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-cm-text">Notifications</h1>
          <p className="mt-2 text-sm leading-6 text-cm-text-muted">
            Company events and items requiring Admin attention.
          </p>
          <p className="mt-2 inline-flex rounded-full border border-cm-border bg-white px-3 py-1 text-xs font-medium text-cm-text-muted">
            {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {import.meta.env.DEV && (
            <Button
              variant="outline"
              onClick={handleTestNotification}
              disabled={testLoading}
            >
              {testLoading ? "Creating..." : "Test Notification"}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            Mark All Read
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 rounded-cm-lg border border-cm-border bg-white p-3 shadow-sm">
        {FILTERS.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "primary" : "outline"}
            onClick={() => setFilter(value)}
          >
            {value === "BRD_SUBMITTED"
              ? "BRD"
              : value === "SYSTEM_TEST"
                ? "System Test"
                : value}
          </Button>
        ))}
      </div>

      <div className="rounded-cm-lg border border-cm-border bg-white p-3 shadow-sm">
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Search notifications..."
        />
      </div>

      {(error || actionError) && (
        <div
          role="alert"
          className="rounded-cm-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800"
        >
          {actionError || error}
        </div>
      )}

      {loading ? (
        <div className="rounded-cm-lg border border-cm-border bg-white p-6 text-sm text-cm-text-muted shadow-sm">
          Loading notifications...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-cm-lg border border-cm-border bg-white p-10 text-center text-sm text-cm-text-muted shadow-sm">
          {notifications.length === 0
            ? "No notifications yet."
            : "No notifications match your search or filter."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className={`rounded-cm-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                item.readAt
                  ? "border-cm-border"
                  : "border-cm-primary/40 bg-cm-primary/[0.025]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <button
                  type="button"
                  onClick={() => openNotification(item)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-cm-text">
                      {item.title}
                    </h2>

                    <Badge tone={item.readAt ? "neutral" : "info"}>
                      {item.readAt ? "Read" : "Unread"}
                    </Badge>

                    <Badge tone="neutral">{item.type}</Badge>
                  </div>

                  <p className="mt-2 text-sm text-cm-text-muted">
                    {item.message}
                  </p>

                  <p className="mt-2 text-xs text-cm-text-muted">
                    {formatTime(item.createdAt)}
                  </p>
                </button>

                {!item.readAt && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkRead(item.id)}
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

export default Notifications;