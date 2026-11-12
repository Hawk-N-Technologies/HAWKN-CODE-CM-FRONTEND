
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import TableSearch from "../../components/tables/TableSearch";
import { useNotifications } from "../../context/NotificationContext";

const FILTERS = [
  "All",
  "Unread",
  "LEAVE_REQUEST_SUBMITTED",
  "LEAVE_APPROVED",
  "LEAVE_REJECTED",
];

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
    markRead,
    markAllRead,
  } = useNotifications();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [actionError, setActionError] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((item) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Unread"
          ? !item.readAt
          : item.type === filter);

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
        err.response?.data?.message ||
          "Could not mark notification as read.",
      );
    }
  }

  async function handleMarkAllRead() {
    try {
      setActionError("");
      await markAllRead();
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Could not mark notifications as read.",
      );
    }
  }

  async function openNotification(item) {
    if (!item.readAt) {
      try {
        await handleMarkRead(item.id);
      } catch {
        // The error is displayed on the page.
      }
    }

    if (typeof item.link === "string" && item.link.startsWith("/hr/")) {
      navigate(item.link);
    }
  }

  return (
    <section className="flex flex-col gap-6">
      {/* PAGE HEADER */}
      <header className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              HUMAN RESOURCES
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
              Notifications
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Leave requests and other events requiring HR attention.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  unreadCount > 0 ? "bg-blue-400" : "bg-emerald-400"
                }`}
              />
              <span className="text-sm font-medium text-slate-200">
                {unreadCount} unread notification
                {unreadCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="relative z-10 shrink-0">
            <Button
              variant="outline"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              Mark All Read
            </Button>
          </div>
        </div>
      </header>

      {/* FILTERS AND SEARCH */}
      <div className="rounded-2xl border border-cm-border bg-cm-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-cm-text">
                Notification Centre
              </h2>
              <p className="mt-1 text-xs text-cm-text-muted">
                Filter notifications by status or event type.
              </p>
            </div>

            <Badge tone="info">
              {filtered.length} {filtered.length === 1 ? "Result" : "Results"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((value) => (
              <Button
                key={value}
                size="sm"
                variant={filter === value ? "primary" : "outline"}
                onClick={() => setFilter(value)}
              >
                {value === "LEAVE_REQUEST_SUBMITTED"
                  ? "New Leave Requests"
                  : value === "LEAVE_APPROVED"
                    ? "Approved"
                    : value === "LEAVE_REJECTED"
                      ? "Rejected"
                      : value}
              </Button>
            ))}
          </div>

          <div className="border-t border-cm-border pt-4">
            <TableSearch
              value={search}
              onChange={setSearch}
              placeholder="Search notifications..."
            />
          </div>
        </div>
      </div>

      {/* ERROR STATE */}
      {(error || actionError) && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <span className="mt-0.5 font-bold">!</span>
          <p>{actionError || error}</p>
        </div>
      )}

      {/* NOTIFICATION LIST */}
      {loading ? (
        <div className="rounded-2xl border border-cm-border bg-cm-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cm-border border-t-blue-600" />
          <p className="text-sm font-medium text-cm-text">
            Loading notifications...
          </p>
          <p className="mt-1 text-xs text-cm-text-muted">
            Retrieving your latest HR updates.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cm-border bg-cm-card px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
          </div>

          <h3 className="mt-4 text-base font-semibold text-cm-text">
            {notifications.length === 0
              ? "No notifications yet"
              : "No matching notifications"}
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-cm-text-muted">
            {notifications.length === 0
              ? "You're all caught up. New HR notifications will appear here."
              : "Try changing your search term or selecting a different filter."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className={`group relative overflow-hidden rounded-2xl border bg-cm-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6 ${
                item.readAt
                  ? "border-cm-border"
                  : "border-blue-200"
              }`}
            >
              {!item.readAt && (
                <div className="absolute bottom-0 left-0 top-0 w-1 bg-blue-500" />
              )}

              <div className="flex flex-wrap items-start justify-between gap-4">
                <button
                  type="button"
                  onClick={() => openNotification(item)}
                  className="min-w-0 flex-1 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        item.readAt ? "bg-slate-300" : "bg-blue-500"
                      }`}
                    />

                    <h2 className="font-semibold text-cm-text transition-colors group-hover:text-blue-700">
                      {item.title}
                    </h2>

                    <Badge tone={item.readAt ? "neutral" : "info"}>
                      {item.readAt ? "Read" : "Unread"}
                    </Badge>

                    <Badge tone="neutral">{item.type}</Badge>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-cm-text-muted">
                    {item.message}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-cm-text-muted">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>

                    <span>{formatTime(item.createdAt)}</span>

                    {typeof item.link === "string" &&
                      item.link.startsWith("/hr/") && (
                        <>
                          <span className="text-cm-border">•</span>
                          <span className="font-medium text-blue-600">
                            View details
                          </span>
                        </>
                      )}
                  </div>
                </button>

                {!item.readAt && (
                  <div className="shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkRead(item.id)}
                    >
                      Mark Read
                    </Button>
                  </div>
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
