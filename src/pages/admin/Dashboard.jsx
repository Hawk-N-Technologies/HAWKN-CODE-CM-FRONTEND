import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FolderKanban,
  Inbox,
  Users,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";

const EMPTY_OVERVIEW = {
  cards: {
    totalEmployees: 0,
    activeProjects: 0,
    activeClients: 0,
    pendingApprovals: 0,
    projectsNearDeadline: 0,
  },
  pendingApprovals: [],
  activityFeed: [],
};

const ICONS = {
  employees: <Users size={21} strokeWidth={1.8} />,
  projects: <FolderKanban size={21} strokeWidth={1.8} />,
  clients: <UsersRound size={21} strokeWidth={1.8} />,
  approvals: <ClipboardCheck size={21} strokeWidth={1.8} />,
  deadline: <Clock3 size={21} strokeWidth={1.8} />,
};

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SectionHeader({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cm-border bg-cm-bg text-cm-text">
          <Icon size={19} strokeWidth={1.8} />
        </div>

        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-cm-text">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-cm-text-muted">
            {description}
          </p>
        </div>
      </div>

      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="mt-5 flex min-h-[175px] flex-col items-center justify-center rounded-xl border border-dashed border-cm-border bg-cm-bg/50 px-5 py-7 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cm-border bg-cm-card text-cm-text-muted shadow-sm">
        <Icon size={22} strokeWidth={1.7} />
      </div>

      <p className="mt-3 text-sm font-semibold text-cm-text">
        {title}
      </p>

      <p className="mt-1 max-w-xs text-xs leading-5 text-cm-text-muted">
        {description}
      </p>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      console.log("Fetching dashboard overview...");
      const response = await axios.get("/api/admin/overview", {
        withCredentials: true,
        signal,
      });

      console.log("Dashboard API response:", response.data);

      // Supports either { data: { cards, ... } } or { cards, ... } responses.
      const payload = response.data?.data ?? response.data;
      setData(payload ?? EMPTY_OVERVIEW);
    } catch (err) {
      if (err.code === "ERR_CANCELED" || err.name === "CanceledError") return;

      console.error("Dashboard API request failed:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load dashboard data.",
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadOverview(controller.signal);
    return () => controller.abort();
  }, [loadOverview]);

  if (loading && !data) {
    return <Loader context="page" label="Loading dashboard..." />;
  }

  if (error && !data) {
    return (
      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10" />

        <div className="relative z-10">
          <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
            ADMINISTRATION
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
            Admin Dashboard
          </h1>

          <p className="mt-3 text-sm leading-6 text-red-200">
            {error}
          </p>

          <button
            type="button"
            onClick={() => loadOverview()}
            className="mt-5 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  const overview = { ...EMPTY_OVERVIEW, ...(data ?? {}) };
  const cards = { ...EMPTY_OVERVIEW.cards, ...(overview.cards ?? {}) };

  const pendingApprovals = Array.isArray(overview.pendingApprovals)
    ? overview.pendingApprovals
    : [];

  const activityFeed = Array.isArray(overview.activityFeed)
    ? overview.activityFeed
    : [];

  const kpiCards = [
    {
      label: "Total Employees",
      value: cards.totalEmployees ?? 0,
      icon: ICONS.employees,
      accent: "blue",
    },
    {
      label: "Active Projects",
      value: cards.activeProjects ?? 0,
      icon: ICONS.projects,
      accent: "success",
    },
    {
      label: "Active Clients",
      value: cards.activeClients ?? 0,
      icon: ICONS.clients,
      accent: "purple",
    },
    {
      label: "Pending Approvals",
      value: cards.pendingApprovals ?? pendingApprovals.length,
      icon: ICONS.approvals,
      accent: "warning",
    },
    {
      label: "Projects Near Deadline",
      value: cards.projectsNearDeadline ?? 0,
      icon: ICONS.deadline,
      accent: "warning",
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-7">
      {/* REFRESH ERROR */}
      {error && (
        <div className="rounded-xl border border-cm-border bg-cm-bg px-4 py-3 text-sm text-cm-danger-600">
          Could not refresh dashboard data: {error}
        </div>
      )}

      {/* ADMIN PAGE HEADER */}
      <header className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              ADMINISTRATION
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
              Admin Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Your company at a glance. Review team metrics, track approvals,
              and stay on top of workspace activity.
            </p>
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-blue-100">
              <Users size={21} strokeWidth={1.8} />
            </div>

            <div>
              <p className="text-2xl font-bold leading-7 tracking-tight text-white">
                {cards.totalEmployees ?? 0}
              </p>

              <p className="mt-1 text-xs text-slate-300">
                Team members
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* KPI CARDS */}
      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-cm-text">
              Company Overview
            </h2>

            <p className="mt-1 text-xs text-cm-text-muted">
              Key metrics across your organization.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs text-cm-text-muted">
            <Activity size={14} />
            {loading ? "Refreshing totals..." : "Current totals"}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {kpiCards.map((kpi) => (
            <StatCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      {/* WORKSPACE ACTIVITY */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold tracking-tight text-cm-text">
            Workspace Activity
          </h2>

          <p className="mt-1 text-xs text-cm-text-muted">
            Approvals and updates that may need your attention.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* PENDING BRD APPROVALS */}
          <section className="min-w-0 rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm sm:p-6">
            <SectionHeader
              icon={ClipboardCheck}
              title="Pending BRD Approvals"
              description="Business requirement documents awaiting review"
              action={
                <Badge tone={pendingApprovals.length ? "warning" : "neutral"}>
                  {pendingApprovals.length} pending
                </Badge>
              }
            />

            {pendingApprovals.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="You're all caught up"
                description="There are no BRD approvals waiting for your review."
              />
            ) : (
              <ul className="mt-5 divide-y divide-cm-border">
                {pendingApprovals.map((item, index) => (
                  <li
                    key={item.id ?? item.uuid ?? index}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-cm-text">
                        {item.name ?? item.title ?? "Untitled approval"}
                      </p>

                      <p className="mt-1 text-xs text-cm-text-muted">
                        Submitted {formatDate(item.date ?? item.createdAt)}
                      </p>
                    </div>

                    <Link
                      to={item.link || "/admin/brd"}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-cm-border bg-cm-card px-3 py-2 text-xs font-semibold text-cm-text transition-colors hover:border-blue-300 hover:bg-cm-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cm-blue-600"
                    >
                      Review <ArrowUpRight size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* RECENT ACTIVITY */}
          <section className="min-w-0 rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm sm:p-6">
            <SectionHeader
              icon={Activity}
              title="Recent Activity"
              description="The latest updates from your workspace"
              action={
                <Badge tone="neutral" showIcon>
                  Latest updates
                </Badge>
              }
            />

            {activityFeed.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No activity yet"
                description="Recent company updates and user actions will appear here when activity tracking is connected."
              />
            ) : (
              <ul className="mt-5 divide-y divide-cm-border">
                {activityFeed.map((item, index) => (
                  <li
                    key={item.id ?? item.uuid ?? index}
                    className="flex gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cm-border bg-cm-bg text-cm-text-muted">
                      <CalendarClock size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm leading-5 text-cm-text">
                        {item.message ??
                          item.description ??
                          "Workspace updated"}
                      </p>

                      {(item.date || item.createdAt) && (
                        <p className="mt-1 text-xs text-cm-text-muted">
                          {formatDate(item.date ?? item.createdAt)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex items-start gap-2 border-t border-cm-border pt-4 text-xs leading-5 text-cm-text-muted">
        <CalendarClock size={15} className="mt-0.5 shrink-0" />

        <p>
          Dashboard metrics reflect the latest data from your connected modules.
        </p>
      </footer>
    </div>
  );
}

export default Dashboard;
