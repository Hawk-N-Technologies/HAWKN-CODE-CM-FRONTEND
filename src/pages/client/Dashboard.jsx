
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FolderKanban,
  Layers3,
  ListChecks,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  getClientProjects,
  getErrorMessage,
} from "../../services/clientProjectService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_STYLE = {
  Planning: "border-slate-200 bg-slate-50 text-slate-700",
  "In Development": "border-blue-200 bg-blue-50 text-blue-800",
  Testing: "border-amber-200 bg-amber-50 text-amber-800",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "On Hold": "border-amber-200 bg-amber-50 text-amber-800",
  Cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

const shortId = (uuid) =>
  uuid ? `PRJ-${String(uuid).slice(0, 6).toUpperCase()}` : "—";

const formatDate = (value) => {
  if (!value) return "Not set";

  const [year, month, day] = String(value)
    .slice(0, 10)
    .split("-")
    .map(Number);

  if (!year || !month || !day) return "Not set";

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const clampProgress = (value) =>
  Math.min(100, Math.max(0, Number(value) || 0));

const getDeadlineState = (project) => {
  if (project.isOverdue) {
    return {
      label: `Overdue by ${Math.abs(Number(project.daysLeft) || 0)}d`,
      className: "text-rose-700",
      icon: CircleAlert,
    };
  }

  if (project.isDueSoon) {
    return {
      label:
        Number(project.daysLeft) === 0
          ? "Due today"
          : `${project.daysLeft}d left`,
      className: "text-amber-700",
      icon: Clock3,
    };
  }

  return null;
};

const getProjectStatusClass = (status) =>
  STATUS_STYLE[status] || "border-slate-200 bg-slate-50 text-slate-600";

// ---------------------------------------------------------------------------
// Reusable UI
// ---------------------------------------------------------------------------

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cm-text-muted">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-1 text-lg font-bold tracking-tight text-cm-navy-950">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-cm-text-muted">{description}</p>
        )}
      </div>

      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  loading,
  muted = false,
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-blue-500/[0.045] transition-transform duration-300 group-hover:scale-125" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-cm-navy-950">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>

        {muted && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Coming soon
          </span>
        )}
      </div>

      <p className="relative mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-cm-text-muted">
        {label}
      </p>

      <p className="relative mt-1 text-3xl font-bold tracking-tight text-cm-navy-950 tabular-nums">
        {loading ? (
          <span className="inline-block h-9 w-14 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          value
        )}
      </p>

      <p className="relative mt-2 text-xs text-cm-text-muted">{note}</p>
    </article>
  );
}

function ProgressTrack({ value }) {
  const progress = clampProgress(value);

  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Project completion"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-700 to-indigo-600 transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="w-10 text-right text-xs font-bold tabular-nums text-cm-navy-950">
        {progress}%
      </span>
    </div>
  );
}

function ProjectCard({ project, onOpen }) {
  const deadline = getDeadlineState(project);
  const progress = clampProgress(project.progress);

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-cm-navy-950">
            <FolderKanban className="h-5 w-5" strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-cm-text-muted">
              {shortId(project.uuid)}
            </p>

            <h3 className="mt-1 truncate text-sm font-bold text-cm-navy-950">
              {project.name || "Untitled project"}
            </h3>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getProjectStatusClass(project.status)}`}
        >
          {project.status || "Unknown"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-cm-text-muted">
            Project lead
          </p>

          <p className="mt-1 truncate text-xs font-semibold text-cm-text">
            {project.leadName || "To be assigned"}
          </p>
        </div>

        <div className="min-w-0 border-l border-cm-border pl-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-cm-text-muted">
            Deadline
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-cm-text">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-cm-text-muted" />
            {formatDate(project.deadline)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-cm-text">
            Delivery progress
          </p>

          {deadline && (
            <span
              className={`flex items-center gap-1 text-[10px] font-semibold ${deadline.className}`}
            >
              <deadline.icon className="h-3 w-3" />
              {deadline.label}
            </span>
          )}
        </div>

        <ProgressTrack value={progress} />
      </div>

      <div className="mt-auto mt-5 flex items-center justify-between border-t border-cm-border pt-4">
        <span className="text-[11px] text-cm-text-muted">
          {progress === 100 ? "Project completed" : "Project overview"}
        </span>

        <button
          type="button"
          onClick={() => onOpen(project)}
          className="inline-flex items-center gap-2 rounded-lg bg-cm-navy-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
        >
          View details
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Project Details Modal
// ---------------------------------------------------------------------------

function ProjectDetailsModal({ project, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const progress = clampProgress(project.progress);

  const details = [
    ["Project ID", shortId(project.uuid)],
    ["Project lead", project.leadName || "To be assigned"],
    ["Project tier", project.tier || "—"],
    ["Project type", project.projectType || "—"],
    ["Start date", formatDate(project.startDate)],
    ["Deadline", formatDate(project.deadline)],
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-project-modal-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Modal title header */}
        <header className="relative isolate overflow-hidden border-b border-slate-200 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-5 py-5 text-white sm:px-6 sm:py-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full border border-white/10"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-5 -top-12 h-36 w-36 rounded-full border border-white/10"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 h-40 w-40 bg-blue-500/10 blur-3xl"
          />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100">
                <FolderKanban className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">
                  Project details · {shortId(project.uuid)}
                </p>

                <h2
                  id="client-project-modal-title"
                  className="mt-1 truncate text-lg font-bold tracking-tight text-white sm:text-xl"
                >
                  {project.name || "Project details"}
                </h2>

                <p className="mt-1 text-xs text-slate-300">
                  Project overview and delivery information
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close project details"
              className="relative z-10 shrink-0 rounded-lg border border-white/15 bg-white/10 p-2 text-slate-200 transition hover:border-white/25 hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Modal content */}
        <div className="overflow-y-auto bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getProjectStatusClass(project.status)}`}
            >
              {project.status || "Unknown"}
            </span>

            {project.tier && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                {project.tier}
              </span>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Project description
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {project.description ||
                "No project description has been provided."}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/20"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {label}
                </p>

                <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-cm-navy-950">
                Delivery progress
              </p>

              <span className="text-lg font-bold tabular-nums text-cm-navy-950">
                {progress}%
              </span>
            </div>

            <div className="mt-3">
              <ProgressTrack value={progress} />
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <footer className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-cm-navy-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
          >
            Done
          </button>
        </footer>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function ProjectSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-cm-border bg-cm-card p-5"
        >
          <div className="h-5 w-2/3 rounded bg-slate-100" />
          <div className="mt-5 h-14 rounded-xl bg-slate-100" />
          <div className="mt-5 h-2 rounded-full bg-slate-100" />
          <div className="mt-5 h-9 w-28 rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    let ignore = false;

    getClientProjects()
      .then((result) => {
        if (ignore) return;
        setData(result);
        setLoadError(null);
      })
      .catch((error) => {
        if (!ignore) {
          setLoadError(getErrorMessage(error, "Couldn't load your projects."));
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

  const projects = data?.projects ?? [];
  const summary = data?.summary ?? {};
  const activeCount = Number(summary.active ?? 0);
  const completedCount = Number(summary.completed ?? 0);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        [
          project.name,
          project.status,
          project.tier,
          project.projectType,
          project.leadName,
          project.uuid,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "All" || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const statusOptions = useMemo(
    () => [
      "All",
      ...new Set(projects.map((project) => project.status).filter(Boolean)),
    ],
    [projects],
  );

  const stats = [
    {
      label: "Active projects",
      value: activeCount,
      note: "Projects currently in progress",
      icon: FolderKanban,
      muted: false,
    },
    {
      label: "Completed projects",
      value: completedCount,
      note: "Successfully delivered projects",
      icon: CheckCircle2,
      muted: false,
    },
    {
      label: "Assigned tasks",
      value: "—",
      note: "Task tracking isn't connected yet",
      icon: ListChecks,
      muted: true,
    },
    {
      label: "Open bugs",
      value: "—",
      note: "Bug tracking isn't connected yet",
      icon: CircleAlert,
      muted: true,
    },
  ];

  return (
    <div className="min-h-full space-y-7 pb-8">
      {/* Client Dashboard Hero Header */}
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

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              <Sparkles className="h-3.5 w-3.5" />
              CLIENT WORKSPACE
            </span>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
              Your project overview
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Everything happening across your projects, progress and delivery
              timelines, in one clear view.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-semibold text-white">
                Your workspace
              </p>

              <p className="mt-0.5 text-[11px] text-slate-300">
                Private project overview
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Workspace Metrics */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cm-text-muted">
              At a glance
            </p>

            <h2 className="mt-1 text-lg font-bold text-cm-navy-950">
              Workspace summary
            </h2>
          </div>

          <span className="text-xs text-cm-text-muted">
            {isLoading ? "Updating…" : `${projects.length} total projects`}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              {...stat}
              loading={isLoading && !stat.muted}
            />
          ))}
        </div>
      </section>

      {/* Project Delivery Tracker */}
      <section className="rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow="Delivery tracker"
          title="My projects"
          description="Follow progress, ownership and important delivery dates."
          action={
            <span className="inline-flex items-center gap-2 rounded-full border border-cm-border bg-slate-50 px-3 py-1.5 text-xs font-semibold text-cm-navy-950">
              <Layers3 className="h-3.5 w-3.5" />
              {projects.length} projects
            </span>
          }
        />

        {/* Search and Status Filters */}
        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cm-text-muted" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by project, lead or status…"
              className="h-11 w-full rounded-xl border border-cm-border bg-white pl-10 pr-4 text-sm text-cm-text outline-none transition placeholder:text-cm-text-muted focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  statusFilter === status
                    ? "border-cm-navy-950 bg-cm-navy-950 text-white"
                    : "border-cm-border bg-white text-cm-text-muted hover:border-blue-300 hover:text-cm-navy-950"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Project List States */}
        {isLoading ? (
          <div className="mt-5">
            <ProjectSkeleton />
          </div>
        ) : loadError ? (
          <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-rose-800">
                We couldn't load your projects
              </p>

              <p className="mt-1 text-sm text-rose-700">{loadError}</p>
            </div>

            <button
              type="button"
              onClick={retry}
              className="rounded-lg bg-cm-navy-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
            >
              Try again
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-cm-border bg-slate-50/70 px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-cm-navy-950">
              <FolderKanban className="h-5 w-5" />
            </div>

            <h3 className="mt-4 text-sm font-bold text-cm-navy-950">
              No projects assigned yet
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-cm-text-muted">
              When a project is assigned to your account, its status, timeline
              and delivery progress will appear here.
            </p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-cm-border bg-slate-50/50 px-5 py-10 text-center">
            <Search className="mx-auto h-5 w-5 text-cm-text-muted" />

            <p className="mt-3 text-sm font-semibold text-cm-navy-950">
              No matching projects
            </p>

            <p className="mt-1 text-xs text-cm-text-muted">
              Try another search term or status filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
              }}
              className="mt-3 text-xs font-bold text-blue-800 underline underline-offset-4 hover:text-blue-950"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.uuid}
                project={project}
                onOpen={setSelectedProject}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section className="overflow-hidden rounded-2xl border border-cm-border bg-cm-card shadow-sm">
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-cm-navy-950">
            <Clock3 className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-cm-navy-950">
                Recent activity
              </h2>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                Coming soon
              </span>
            </div>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-cm-text-muted">
              Project updates, milestone changes and document activity will
              appear here when the activity feed is connected.
            </p>
          </div>

          <ArrowDownRight className="hidden h-5 w-5 text-cm-text-muted sm:block" />
        </div>

        <div className="border-t border-cm-border bg-slate-50/70 px-5 py-3 sm:px-6">
          <p className="flex items-center gap-2 text-xs text-cm-text-muted">
            <Check className="h-3.5 w-3.5 text-blue-700" />
            Only verified project information is shown on this dashboard.
          </p>
        </div>
      </section>

      {/* Project Details Popup */}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
