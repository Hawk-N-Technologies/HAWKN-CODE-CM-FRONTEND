import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import TableSearch from "../../components/tables/TableSearch";
import { useNotifications } from "../../context/NotificationContext";

const FILTERS = ["All", "Unread", "TASK_ASSIGNED"];

function formatTime(value) {
  if (!value) return "Time unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Time unavailable";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function Notifications() {
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
    try {
      if (!item.readAt) {
        await handleMarkRead(item.id);
      }

      if (
        typeof item.link === "string" &&
        item.link.startsWith("/developer/")
      ) {
        navigate(item.link);
      }
    } catch (err) {
      console.error("Unable to open notification:", err);
    }
  }

  return (
    <section className="flex flex-col gap-6">
      {/* Standardized Developer Page Header */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        {/* Decorative Background Elements */}
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-blue-300/[0.12]" />
        <div className="pointer-events-none absolute -right-8 -top-16 h-56 w-56 rounded-full border border-blue-300/[0.12]" />
        <div className="pointer-events-none absolute right-12 top-8 h-32 w-32 rounded-full border border-indigo-300/[0.10]" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-blue-500/[0.08] blur-3xl" />

        <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-center">
          <div className="min-w-0">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/[0.08] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-200 sm:text-[11px]">
                Development
              </p>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[34px]">
              Notifications
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-[15px]">
              Stay informed about task assignments and development updates.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                {notifications.length} Total Notifications
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {unreadCount} Unread
              </div>
            </div>
          </div>

          <div className="relative flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
            <Button
              variant="outline"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              Mark All Read
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Filters */}
      <section className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#101b32]">
              Notification Center
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Filter and search your notifications.
            </p>
          </div>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
            {filtered.length} Results
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "primary" : "outline"}
              onClick={() => setFilter(value)}
            >
              {value === "TASK_ASSIGNED" ? "Task Assigned" : value}
            </Button>
          ))}
        </div>

        <div className="mt-4">
          <TableSearch
            value={search}
            onChange={setSearch}
            placeholder="Search notifications..."
          />
        </div>
      </section>

      {/* Error State */}
      {(error || actionError) && (
        <div
          role="alert"
          className="rounded-[14px] border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {actionError || error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div
          className="rounded-[16px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm"
          role="status"
        >
          Loading notifications...
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="rounded-[16px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-500">
            N
          </div>

          <h2 className="mt-3 font-semibold text-[#101b32]">
            {notifications.length === 0
              ? "No notifications yet"
              : "No matching notifications"}
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            {notifications.length === 0
              ? "New task assignments and development updates will appear here."
              : "Try changing your search term or notification filter."}
          </p>
        </div>
      ) : (
        /* Notification List */
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#101b32]">
                Recent Notifications
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Select a notification to mark it as read and open its linked page.
              </p>
            </div>

            <span className="text-xs text-slate-400">
              {filtered.length} Notifications
            </span>
          </div>

          {filtered.map((item) => (
            <article
              key={item.id}
              className={`rounded-[16px] border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                item.readAt
                  ? "border-slate-200"
                  : "border-blue-200 bg-gradient-to-r from-blue-50/40 to-white"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <button
                  type="button"
                  onClick={() => openNotification(item)}
                  className="min-w-0 flex-1 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[#101b32]">
                      {item.title}
                    </h3>

                    <Badge tone={item.readAt ? "neutral" : "info"}>
                      {item.readAt ? "Read" : "Unread"}
                    </Badge>

                    <Badge tone="neutral">{item.type}</Badge>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.message}
                  </p>

                  <p className="mt-3 text-xs text-slate-400">
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