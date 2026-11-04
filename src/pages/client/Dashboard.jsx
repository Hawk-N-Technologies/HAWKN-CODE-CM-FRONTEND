import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
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
  Planning: "border-cm-border bg-cm-bg text-cm-text-muted",
  "In Development": "border-cm-navy-950/15 bg-cm-navy-950/5 text-cm-navy-950",
  Testing: "border-amber-200 bg-amber-50 text-amber-800",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "On Hold": "border-amber-200 bg-amber-50 text-amber-800",
  Cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

const shortId = (uuid) =>
  uuid ? `PRJ-${String(uuid).slice(0, 6).toUpperCase()}` : "—";

const formatDate = (value) => {
  if (!value) return "Not set";
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "Not set";
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const clampProgress = (value) => Math.min(100, Math.max(0, Number(value) || 0));

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
  STATUS_STYLE[status] || "border-cm-border bg-cm-bg text-cm-text-muted";

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

function StatCard({ label, value, note, icon: Icon, loading, muted = false }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-cm-navy-950/[0.035] transition-transform duration-300 group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cm-navy-950 text-white shadow-sm">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        {muted && (
          <span className="rounded-full border border-cm-border bg-cm-bg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-cm-text-muted">
            Coming soon
          </span>
        )}
      </div>
      <p className="relative mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-cm-text-muted">
        {label}
      </p>
      <p className="relative mt-1 text-3xl font-bold tracking-tight text-cm-navy-950 tabular-nums">
        {loading ? (
          <span className="inline-block h-9 w-14 animate-pulse rounded-lg bg-cm-bg" />
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
        className="h-2 flex-1 overflow-hidden rounded-full bg-cm-border"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Project completion"
      >
        <div
          className="h-full rounded-full bg-cm-navy-950 transition-[width] duration-700 ease-out"
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
    <article className="group flex h-full flex-col rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-cm-navy-950/25 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cm-navy-950/[0.06] text-cm-navy-950">
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

      <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-cm-bg/70 p-3">
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

      <div className="mt-auto flex items-center justify-between border-t border-cm-border pt-4 mt-5">
        <span className="text-[11px] text-cm-text-muted">
          {progress === 100 ? "Project completed" : "Project overview"}
        </span>
        <button
          type="button"
          onClick={() => onOpen(project)}
          className="inline-flex items-center gap-2 rounded-lg bg-cm-navy-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-cm-navy-900 focus:outline-none focus:ring-2 focus:ring-cm-navy-950 focus:ring-offset-2"
        >
          View details
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-cm-navy-950/65 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-project-modal-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-cm-border bg-cm-card shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-cm-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cm-text-muted">
              {shortId(project.uuid)}
            </p>
            <h2
              id="client-project-modal-title"
              className="mt-1 truncate text-lg font-bold text-cm-navy-950"
            >
              {project.name || "Project details"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close project details"
            className="rounded-lg p-2 text-cm-text-muted transition hover:bg-cm-bg hover:text-cm-navy-950 focus:outline-none focus:ring-2 focus:ring-cm-navy-950"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getProjectStatusClass(project.status)}`}
            >
              {project.status || "Unknown"}
            </span>
            {project.tier && (
              <span className="rounded-full border border-cm-border px-3 py-1 text-xs font-medium text-cm-text-muted">
                {project.tier}
              </span>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-cm-border bg-cm-bg/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cm-text-muted">
              Project description
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-cm-text">
              {project.description ||
                "No project description has been provided."}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-cm-border p-4"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-cm-text-muted">
                  {label}
                </p>
                <p className="mt-1.5 break-words text-sm font-semibold text-cm-text">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-cm-border p-4">
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

        <footer className="flex justify-end border-t border-cm-border bg-cm-bg/50 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-cm-navy-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cm-navy-900 focus:outline-none focus:ring-2 focus:ring-cm-navy-950 focus:ring-offset-2"
          >
            Done
          </button>
        </footer>
      </section>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-cm-border bg-cm-card p-5"
        >
          <div className="h-5 w-2/3 rounded bg-cm-bg" />
          <div className="mt-5 h-14 rounded-xl bg-cm-bg" />
          <div className="mt-5 h-2 rounded-full bg-cm-bg" />
          <div className="mt-5 h-9 w-28 rounded-lg bg-cm-bg" />
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
      {/* Hero */}
      <header className="relative isolate overflow-hidden rounded-3xl bg-cm-navy-950 px-6 py-7 text-white shadow-lg sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-4 -top-12 h-56 w-56 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute bottom-[-5rem] right-1/4 h-44 w-44 rounded-full bg-white/[0.04] blur-2xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
              <Sparkles className="h-3.5 w-3.5" />
              Client workspace
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Your project overview
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
              Everything happening across your projects, progress and delivery
              timelines — in one clear view.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cm-navy-950">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Your workspace</p>
              <p className="mt-0.5 text-[11px] text-white/65">
                Private project overview
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Metrics */}
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

      {/* Projects */}
      <section className="rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow="Delivery tracker"
          title="My projects"
          description="Follow progress, ownership and important delivery dates."
          action={
            <span className="inline-flex items-center gap-2 rounded-full border border-cm-border bg-cm-bg px-3 py-1.5 text-xs font-semibold text-cm-navy-950">
              <Layers3 className="h-3.5 w-3.5" />
              {projects.length} projects
            </span>
          }
        />

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cm-text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by project, lead or status…"
              className="h-11 w-full rounded-xl border border-cm-border bg-cm-bg pl-10 pr-4 text-sm text-cm-text outline-none transition placeholder:text-cm-text-muted focus:border-cm-navy-950 focus:ring-2 focus:ring-cm-navy-950/10"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-cm-navy-950 focus:ring-offset-1 ${
                  statusFilter === status
                    ? "border-cm-navy-950 bg-cm-navy-950 text-white"
                    : "border-cm-border bg-cm-card text-cm-text-muted hover:border-cm-navy-950/40 hover:text-cm-navy-950"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

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
              className="rounded-lg bg-cm-navy-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-cm-navy-900 focus:outline-none focus:ring-2 focus:ring-cm-navy-950 focus:ring-offset-2"
            >
              Try again
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-cm-border bg-cm-bg/50 px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cm-navy-950 text-white">
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
          <div className="mt-5 rounded-xl border border-dashed border-cm-border px-5 py-10 text-center">
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
              className="mt-3 text-xs font-bold text-cm-navy-950 underline underline-offset-4"
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

      {/* Activity module is intentionally not fabricated while no activity API exists. */}
      <section className="overflow-hidden rounded-2xl border border-cm-border bg-cm-card shadow-sm">
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cm-navy-950 text-white">
            <Clock3 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-cm-navy-950">
                Recent activity
              </h2>
              <span className="rounded-full border border-cm-border bg-cm-bg px-2.5 py-1 text-[10px] font-semibold text-cm-text-muted">
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
        <div className="border-t border-cm-border bg-cm-bg/50 px-5 py-3 sm:px-6">
          <p className="flex items-center gap-2 text-xs text-cm-text-muted">
            <Check className="h-3.5 w-3.5 text-cm-navy-950" />
            Only verified project information is shown on this dashboard.
          </p>
        </div>
      </section>

      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
