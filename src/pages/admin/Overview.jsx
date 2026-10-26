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
          <h2 className="text-sm font-semibold text-cm-text">{title}</h2>
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

      <p className="mt-3 text-sm font-semibold text-cm-text">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-cm-text-muted">
        {description}
      </p>
    </div>
  );
}

function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async (signal) => {
    try {
      setError("");
      const response = await axios.get("/api/admin/overview", {
        signal,
        withCredentials: true,
      });

      setData({ ...EMPTY_OVERVIEW, ...response.data.data });
    } catch (requestError) {
      if (requestError.code === "ERR_CANCELED") return;

      setError(
        requestError.response?.data?.message ||
          "Unable to load the admin overview.",
      );
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => loadOverview(controller.signal));

    return () => controller.abort();
  }, [loadOverview]);

  if (error) {
    return (
      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
        <h1 className="text-xl font-bold text-cm-text">Admin Overview</h1>
        <p className="mt-3 text-sm text-cm-danger-600">{error}</p>
        <button
          type="button"
          onClick={() => loadOverview()}
          className="mt-4 rounded-lg border border-cm-border bg-cm-card px-3 py-2 text-sm font-semibold text-cm-text hover:bg-cm-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cm-blue-600"
        >
          Try again
        </button>
      </section>
    );
  }

  if (!data) return <Loader context="page" label="Loading admin overview..." />;

  const cards = data.cards || EMPTY_OVERVIEW.cards;
  const pendingApprovals = Array.isArray(data.pendingApprovals)
    ? data.pendingApprovals
    : [];
  const activityFeed = Array.isArray(data.activityFeed) ? data.activityFeed : [];

  const kpis = [
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
      <section className="relative isolate overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card shadow-sm">
        <div className="relative z-10 flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cm-blue-600" />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cm-text-muted">
                Admin workspace
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-cm-text sm:text-3xl">
              Welcome back, Admin
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-cm-text-muted">
              Your company at a glance. Review team metrics, track approvals,
              and stay on top of workspace activity.
            </p>
          </div>

          <div className="flex w-full shrink-0 items-center gap-3 rounded-xl border border-cm-border bg-cm-bg p-4 sm:w-auto sm:min-w-[190px]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cm-border bg-cm-card text-cm-text shadow-sm">
              <Users size={21} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-2xl font-bold leading-7 tracking-tight text-cm-text">
                {cards.totalEmployees ?? 0}
              </p>
              <p className="mt-1 text-xs text-cm-text-muted">Team members</p>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 -z-0 h-64 w-64 rounded-full border border-cm-border/70"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 -top-12 -z-0 h-40 w-40 rounded-full border border-cm-border/70"
        />
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-cm-text">
              Company overview
            </h2>
            <p className="mt-1 text-xs text-cm-text-muted">
              Key metrics across your organization
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-cm-text-muted">
            <Activity size={14} />
            Current totals
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {kpis.map((kpi) => (
            <StatCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold tracking-tight text-cm-text">
            Workspace activity
          </h2>
          <p className="mt-1 text-xs text-cm-text-muted">
            Approvals and updates that may need your attention
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section className="min-w-0 rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6">
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
                {pendingApprovals.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-cm-text">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-cm-text-muted">
                        Submitted {formatDate(item.date)}
                      </p>
                    </div>

                    <Link
                      to={item.link || "/admin/brd"}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-cm-border bg-cm-card px-3 py-2 text-xs font-semibold text-cm-text transition-colors hover:bg-cm-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cm-blue-600"
                    >
                      Review
                      <ArrowUpRight size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="min-w-0 rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6">
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
                {activityFeed.map((item) => (
                  <li key={item.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cm-border bg-cm-bg text-cm-text-muted">
                      <CalendarClock size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm leading-5 text-cm-text">{item.message}</p>
                      {item.date && (
                        <p className="mt-1 text-xs text-cm-text-muted">
                          {formatDate(item.date)}
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

      <footer className="flex items-start gap-2 border-t border-cm-border pt-4 text-xs leading-5 text-cm-text-muted">
        <CalendarClock size={15} className="mt-0.5 shrink-0" />
        <p>Dashboard metrics reflect the latest data from your connected modules.</p>
      </footer>
    </div>
  );
}

export default Overview;
