import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Layers3,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";

import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import {
  getErrorMessage,
  getMyProjects,
} from "../../services/developerProjectService";

/**
 * Project Lead → Dashboard.
 * "Assigned projects" = projects where the logged-in developer is the
 * Project Lead (same data as Developer → My Projects, same API).
 */

// Still static until the Phases / Tasks modules exist
const STATIC_KPIS = [
  { label: "Active Phases", value: "7" },
  { label: "Open Tasks", value: "24" },
  { label: "Completed Tasks", value: "38" },
];

// Badge only has: success / warning / danger / info / neutral
const STATUS_TONE = {
  Planning: "neutral",
  "In Development": "info",
  Testing: "warning",
  Completed: "success",
  "On Hold": "warning",
  Cancelled: "danger",
};

// Same short ID as Admin / Developer project pages
const shortId = (uuid) => `PRJ-${uuid.slice(0, 6).toUpperCase()}`;

// "2026-10-15" → "15 Oct 2026" (built from parts so timezone can't shift the day)
const formatDate = (yyyyMmDd) => {
  if (!yyyyMmDd) return "Not set";

  const [year, month, day] = String(yyyyMmDd)
    .slice(0, 10)
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function DeadlineText({ project }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
      Deadline: {formatDate(project.deadline)}

      {project.isOverdue && (
        <span className="ml-1 font-medium text-rose-600">
          · Overdue by {Math.abs(project.daysLeft)}d
        </span>
      )}

      {project.isDueSoon && (
        <span className="ml-1 font-medium text-amber-600">
          · {project.daysLeft === 0 ? "Due today" : `${project.daysLeft}d left`}
        </span>
      )}
    </span>
  );
}

function ProjectProgress({ project }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-600">
          Delivery progress
        </span>
        <span className="text-sm font-bold tabular-nums text-[#101a3a]">
          {project.progress}%
        </span>
      </div>

      <div
        className="h-2.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={project.progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${project.name} progress`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            project.progress === 100 ? "bg-emerald-500" : "bg-blue-600"
          }`}
          style={{ width: `${project.progress}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>{project.progress}% complete</span>
        <DeadlineText project={project} />
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800 transition group-hover:bg-blue-100">
            <FolderKanban className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              {shortId(project.uuid)}
            </p>

            <h3 className="mt-1 break-words text-base font-bold text-[#101a3a]">
              {project.name}
            </h3>

            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0" />
              {project.client.name}
            </p>
          </div>
        </div>

        <Badge tone={STATUS_TONE[project.status] ?? "neutral"}>
          {project.status}
        </Badge>
      </div>

      <ProjectProgress project={project} />
    </article>
  );
}

function Dashboard() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const switchToDeveloper = () => {
    navigate("/developer/dashboard");
  };

  useEffect(() => {
    let ignore = false;

    getMyProjects()
      .then((list) => {
        if (ignore) return;

        setProjects(list);
        setLoadError(null);
      })
      .catch((error) => {
        if (!ignore) {
          setLoadError(
            getErrorMessage(error, "Couldn't load your projects."),
          );
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const retry = () => {
    setIsLoading(true);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  };

  // Average over projects that still count (cancelled ones don't)
  const averageProgress = useMemo(() => {
    const counted = projects.filter(
      (project) => project.status !== "Cancelled",
    );

    if (counted.length === 0) return 0;

    return Math.round(
      counted.reduce((sum, project) => sum + project.progress, 0) /
        counted.length,
    );
  }, [projects]);

  const live = (value) => (isLoading ? "…" : loadError ? "—" : value);

  const kpis = [
    {
      label: "Assigned Projects",
      value: live(String(projects.length)),
    },
    ...STATIC_KPIS,
    {
      label: "Average Progress",
      value: live(`${averageProgress}%`),
    },
  ];

  return (
    <div className="flex flex-col gap-7 pb-8">
      {/* Project Lead page header */}
      <header className="relative isolate overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 text-white shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              <Layers3 className="h-3.5 w-3.5" />
              Project management workspace
            </span>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
              Project Lead Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Track assigned projects, monitor delivery progress, and oversee
              planning, phases, and task execution from one workspace.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex min-h-[44px] items-center rounded-xl border border-white/10 bg-white/[0.07] px-4 py-2.5 backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200">
                  Assigned projects
                </p>
                <p className="text-xl font-bold leading-6 tabular-nums text-white">
                  {live(String(projects.length))}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                leftIcon={<ArrowRightLeft size={16} />}
                onClick={switchToDeveloper}
                className="!inline-flex !min-h-[44px] !items-center !justify-center !whitespace-nowrap"
              >
                Switch to Developer
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* KPI overview */}
      <section>
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Delivery overview
          </p>
          <h2 className="mt-1 text-lg font-bold text-[#101a3a]">
            Project performance
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Current portfolio metrics and execution snapshot.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {kpis.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      {/* Assigned projects */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
              <FolderKanban className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Project portfolio
              </p>
              <h2 className="mt-1 text-lg font-bold text-[#101a3a]">
                Assigned Projects
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Projects where you are assigned as Project Lead.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 sm:self-center">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            {isLoading ? "Loading…" : `${projects.length} projects`}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {isLoading && (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                <RefreshCw className="h-5 w-5 animate-spin" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">
                Loading your projects…
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Retrieving your assigned project portfolio.
              </p>
            </div>
          )}

          {!isLoading && loadError && (
            <div className="flex flex-col gap-4 rounded-xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-rose-600">
                  <Clock3 className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-rose-800">
                    Unable to load projects
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-rose-700">
                    {loadError}
                  </p>
                </div>
              </div>

              <Button size="sm" variant="outline" onClick={retry}>
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !loadError && projects.length === 0 && (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
                <FolderKanban className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-sm font-bold text-[#101a3a]">
                No assigned projects yet
              </h3>

              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                You're not leading any projects yet. Projects assigned to you
                as Project Lead will appear here.
              </p>
            </div>
          )}

          {!isLoading && !loadError && projects.length > 0 && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard key={project.uuid} project={project} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
