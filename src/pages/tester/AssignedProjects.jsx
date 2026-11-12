import { useEffect, useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import { getTesterAssignedProjects } from "../../services/testerDashboardService";

const formatDate = (value) => {
  if (!value) return "No deadline";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? "No deadline"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const statusTone = (status) => {
  if (status === "Completed") return "success";
  if (status === "Cancelled") return "danger";
  if (status === "Testing") return "info";
  return "neutral";
};

const getProgressTone = (progress) => {
  if (progress >= 100) return "bg-emerald-500";
  if (progress >= 60) return "bg-blue-500";
  if (progress >= 30) return "bg-amber-500";
  return "bg-slate-400";
};

function PageHeader({ projects }) {
  const completedCount = projects.filter(
    (project) => project.status === "Completed",
  ).length;

  const testingCount = projects.filter(
    (project) => project.status === "Testing",
  ).length;

  return (
    <section className="relative isolate overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border border-blue-300/10" />
      <div className="pointer-events-none absolute -right-5 -top-12 -z-10 h-52 w-52 rounded-full border border-blue-300/10" />
      <div className="pointer-events-none absolute -bottom-28 right-1/4 -z-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-center">
        <div className="min-w-0 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              Tester Workspace
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-[34px]">
            Assigned Projects
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-[15px]">
            View projects assigned to you, monitor their progress, and keep
            track of upcoming project deadlines.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              {projects.length}{" "}
              {projects.length === 1 ? "Assigned Project" : "Assigned Projects"}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {completedCount} Completed
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              {testingCount} In Testing
            </span>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 xl:w-[280px] xl:shrink-0">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Total Assigned
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-white">
              {projects.length}
            </p>
            <p className="mt-1 text-xs text-slate-400">Projects</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Completed
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-300">
              {completedCount}
            </p>
            <p className="mt-1 text-xs text-slate-400">Projects</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project }) {
  const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));
  const progressTone = getProgressTone(progress);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-cm-border bg-cm-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_14px_35px_rgba(15,23,42,0.09)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 opacity-80" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <rect
                x="3.5"
                y="4"
                width="17"
                height="16"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="M8 8h8M8 12h8M8 16h4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="min-w-0 pt-0.5">
            <h2 className="break-words text-base font-bold leading-6 text-cm-text transition-colors group-hover:text-blue-700">
              {project.name}
            </h2>
            <p className="mt-1 break-all text-[11px] font-medium tracking-wide text-cm-text-muted">
              ID: {String(project.uuid || "").slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <Badge tone={statusTone(project.status)}>
            {project.status || "Not set"}
          </Badge>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-cm-border bg-cm-bg/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cm-text-muted">
              Project Lead
            </p>
            <p className="mt-1.5 truncate text-sm font-semibold text-cm-text">
              {project.projectLead || "Not assigned"}
            </p>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="8"
                r="3.5"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="M5 20c.7-3.5 3.1-5.2 7-5.2s6.3 1.7 7 5.2"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-cm-text">
              Project Progress
            </p>
            <p className="mt-0.5 text-[11px] text-cm-text-muted">
              Overall completion
            </p>
          </div>

          <span className="text-lg font-bold tabular-nums text-cm-text">
            {progress}
            <span className="ml-0.5 text-xs font-semibold text-cm-text-muted">
              %
            </span>
          </span>
        </div>

        <div
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-cm-border"
          role="progressbar"
          aria-label={`${project.name} progress`}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressTone}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-cm-text-muted">
          <span>0% Complete</span>
          <span>100% Complete</span>
        </div>
      </div>

      <div className="mt-auto border-t border-cm-border pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-cm-text-muted">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <rect
                x="3.5"
                y="5"
                width="17"
                height="16"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="M7.5 3v4M16.5 3v4M4 10h16"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xs font-medium">Project Deadline</span>
          </div>

          <p className="text-right text-sm font-semibold text-cm-text">
            {formatDate(project.deadline)}
          </p>
        </div>
      </div>
    </article>
  );
}

function ProjectsOverview({ projects }) {
  const averageProgress = useMemo(() => {
    if (!projects.length) return 0;

    const total = projects.reduce((sum, project) => {
      return sum + Math.min(100, Math.max(0, Number(project.progress) || 0));
    }, 0);

    return Math.round(total / projects.length);
  }, [projects]);

  const upcomingDeadlines = projects.filter((project) => {
    if (!project.deadline || project.status === "Completed") return false;

    const deadline = new Date(`${String(project.deadline).slice(0, 10)}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return !Number.isNaN(deadline.getTime()) && deadline >= today;
  }).length;

  const stats = [
    {
      label: "Total Projects",
      value: projects.length,
      description: "Currently assigned",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <rect x="3.5" y="4" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 8h8M8 12h8M8 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      ),
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      label: "In Testing",
      value: projects.filter((project) => project.status === "Testing").length,
      description: "Active testing status",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path d="m8 12 2.5 2.5L16.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      ),
      iconClass: "bg-sky-50 text-sky-600",
    },
    {
      label: "Completed",
      value: projects.filter((project) => project.status === "Completed").length,
      description: "Successfully completed",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path d="m5 12.5 4.2 4.2L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Upcoming Deadlines",
      value: upcomingDeadlines,
      description: "Pending project deadlines",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <rect x="3.5" y="5" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M7.5 3v4M16.5 3v4M4 10h16M12 13v3l2 1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      ),
      iconClass: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="rounded-[20px] border border-cm-border bg-cm-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-cm-text-muted">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-cm-text">
                {stat.value}
              </p>
              <p className="mt-1 text-[11px] text-cm-text-muted">
                {stat.description}
              </p>
            </div>

            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}>
              {stat.icon}
            </div>
          </div>
        </article>
      ))}

      <article className="rounded-[20px] border border-cm-border bg-cm-card p-5 shadow-sm sm:col-span-2 2xl:col-span-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-cm-text">
              Average Project Progress
            </p>
            <p className="mt-1 text-[11px] text-cm-text-muted">
              Average completion across all assigned projects
            </p>
          </div>

          <p className="text-2xl font-bold tabular-nums text-cm-text">
            {averageProgress}%
          </p>
        </div>

        <div
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-cm-border"
          role="progressbar"
          aria-label="Average project progress"
          aria-valuenow={averageProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
            style={{ width: `${averageProgress}%` }}
          />
        </div>
      </article>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[22px] border border-cm-border bg-cm-card p-8 text-center shadow-sm">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
      <p className="mt-4 text-sm font-semibold text-cm-text">
        Loading assigned projects
      </p>
      <p className="mt-1 text-xs text-cm-text-muted">
        Retrieving your latest project assignments...
      </p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="rounded-[22px] border border-rose-200 bg-rose-50/70 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M12 8v5m0 3h.01M10.3 3.8 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3l-7.4-13.2a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div>
          <p className="text-sm font-semibold text-rose-800">
            Unable to load assigned projects
          </p>
          <p className="mt-1 text-sm leading-6 text-rose-700">{message}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[22px] border border-dashed border-cm-border bg-cm-card px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
          <rect x="3.5" y="4" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 8h8M8 12h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      <h2 className="mt-5 text-base font-bold text-cm-text">
        No projects assigned yet
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-cm-text-muted">
        Projects assigned to you by Admin in Project Operations will appear
        here. Once an assignment is made, you can monitor its status, progress,
        and deadline from this page.
      </p>
    </div>
  );
}

export default function AssignedProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getTesterAssignedProjects()
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load assigned projects.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader projects={projects} />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : projects.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ProjectsOverview projects={projects} />

          <section className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-cm-text">
                  Your Project Assignments
                </h2>
                <p className="mt-1 text-xs text-cm-text-muted">
                  Overview of projects assigned to your testing workspace.
                </p>
              </div>

              <span className="text-xs font-medium text-cm-text-muted">
                {projects.length}{" "}
                {projects.length === 1 ? "project" : "projects"} found
              </span>
            </div>

            <div className="grid items-stretch gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.uuid} project={project} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}