import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BellRing,
  CheckCheck,
  CheckCircle2,
  Clock3,
  FlaskConical,
  Inbox,
  RefreshCw,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import TableSearch from "../../components/tables/TableSearch";
import { useNotifications } from "../../context/NotificationContext";
import { createTestNotification } from "../../services/notificationService";

// -----------------------------------------------------------------------------
// Constants + helpers
// -----------------------------------------------------------------------------

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

function getFilterLabel(value) {
  if (value === "BRD_SUBMITTED") return "BRD";
  if (value === "SYSTEM_TEST") return "System Test";
  return value;
}

// -----------------------------------------------------------------------------
// Reusable UI components
// -----------------------------------------------------------------------------

function SectionHeading({ eyebrow, title, description, icon: Icon }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" />
        </div>
      )}

      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            {eyebrow}
          </p>
        )}
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "blue",
}) {
  const iconStyles = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-slate-100 text-slate-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconStyles[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Notification card
// -----------------------------------------------------------------------------

function NotificationCard({ item, onOpen, onMarkRead }) {
  const isUnread = !item.readAt;

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md sm:p-6 ${
        isUnread
          ? "border-blue-200 hover:border-blue-300"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {isUnread && (
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 top-0 w-1 bg-blue-600"
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="min-w-0 flex-1 text-left outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isUnread
                  ? "bg-blue-50 text-blue-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {isUnread ? (
                <BellRing className="h-5 w-5" />
              ) : (
                <Bell className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-words text-sm font-semibold text-slate-900">
                  {item.title}
                </h3>

                <Badge tone={isUnread ? "info" : "neutral"}>
                  {isUnread ? "Unread" : "Read"}
                </Badge>

                <Badge tone="neutral">{item.type}</Badge>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.message}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <Clock3 className="h-3.5 w-3.5" />
                <span>{formatTime(item.createdAt)}</span>
              </div>
            </div>
          </div>
        </button>

        {isUnread && (
          <div className="flex shrink-0 items-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMarkRead(item.id)}
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Mark Read
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

// -----------------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------------

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

  const readCount = notifications.length - unreadCount;

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
      {/* Standardized Administration header */}
      <header className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-blue-500/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100">
              <Bell className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                ADMINISTRATION
              </span>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
                Notifications
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Monitor company events, BRD submissions, system alerts and
                items requiring Admin attention.
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-blue-100">
                <span
                  className={`h-2 w-2 rounded-full ${
                    unreadCount > 0 ? "bg-blue-300" : "bg-emerald-400"
                  }`}
                />
                {unreadCount} unread notification
                {unreadCount === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-2">
            {import.meta.env.DEV && (
              <Button
                variant="outline"
                onClick={handleTestNotification}
                disabled={testLoading}
              >
                <FlaskConical className="mr-2 h-4 w-4" />
                {testLoading ? "Creating..." : "Test Notification"}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          </div>
        </div>
      </header>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Notifications"
          value={notifications.length}
          description="All received notifications"
          icon={Inbox}
          tone="blue"
        />

        <SummaryCard
          label="Unread"
          value={unreadCount}
          description="Notifications requiring attention"
          icon={BellRing}
          tone="amber"
        />

        <SummaryCard
          label="Read"
          value={readCount}
          description="Notifications already reviewed"
          icon={CheckCircle2}
          tone="green"
        />
      </section>

      {/* Notification list panel */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4">
          <SectionHeading
            eyebrow="ACTIVITY CENTER"
            title="Notification Inbox"
            description="Search, filter and review company notifications."
            icon={Bell}
          />

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 border-y border-slate-100 py-4">
            {FILTERS.map((value) => {
              const active = filter === value;

              return (
                <Button
                  key={value}
                  size="sm"
                  variant={active ? "primary" : "outline"}
                  onClick={() => setFilter(value)}
                >
                  {getFilterLabel(value)}
                  {value === "Unread" && unreadCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Search and result count */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-md">
              <TableSearch
                value={search}
                onChange={setSearch}
                placeholder="Search notifications..."
              />
            </div>

            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">
                {notifications.length}
              </span>{" "}
              notifications
            </p>
          </div>
        </div>

        {/* Errors */}
        {(error || actionError) && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {actionError || error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm text-slate-500">
              Loading notifications...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400">
              <Inbox className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-800">
              {notifications.length === 0
                ? "No notifications yet"
                : "No matching notifications"}
            </h3>

            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
              {notifications.length === 0
                ? "Company notifications will appear here when new events are received."
                : "Try changing the selected filter or using a different search term."}
            </p>
          </div>
        ) : (
          /* Notification cards */
          <div className="mt-5 flex flex-col gap-3">
            {filtered.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                onOpen={openNotification}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        {!loading && notifications.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              {unreadCount > 0
                ? `${unreadCount} notification${unreadCount === 1 ? "" : "s"} still unread`
                : "All notifications have been read"}
            </p>

            <Button
              size="sm"
              variant="outline"
              onClick={refresh}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        )}
      </section>
    </section>
  );
}

export default Notifications;
