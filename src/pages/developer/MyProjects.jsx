import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  FolderKanban,
  LoaderCircle,
  Search,
  Users,
  BriefcaseBusiness,
  RefreshCw,
} from "lucide-react";

const PAGE_SIZE = 8;

const getErrorMessage = (error, fallback = "Something went wrong.") =>
  error?.response?.data?.message || error?.message || fallback;

const shortId = (value) => {
  if (!value) return "—";
  return String(value).slice(0, 8).toUpperCase();
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusTone = (status) => {
  const normalized = String(status || "").toLowerCase();

  if (["completed", "approved", "active", "done"].includes(normalized)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }

  if (
    ["delayed", "overdue", "blocked", "cancelled", "rejected"].includes(
      normalized,
    )
  ) {
    return "bg-rose-50 text-rose-700 ring-rose-600/20";
  }

  if (
    ["in progress", "in_progress", "pending", "on hold"].includes(normalized)
  ) {
    return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }

  return "bg-slate-100 text-slate-700 ring-slate-500/20";
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${getStatusTone(
        status,
      )}`}
    >
      {String(status || "Not set")
        .replaceAll("_", " ")
        .toLowerCase()}
    </span>
  );
}

function ProgressBar({ value }) {
  const progress = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="flex min-w-[110px] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="w-9 text-right text-xs font-semibold tabular-nums text-slate-600">
        {progress}%
      </span>
    </div>
  );
}

function PageHeader({
  title,
  subtitle,
  identity = "DEV",
  eyebrow = "Development",
  label,
  metadata = [],
  action,
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-28 -z-10 h-[290px] w-[290px] rounded-full border border-blue-300/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-5 -top-20 -z-10 h-[220px] w-[220px] rounded-full border border-indigo-300/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 -z-20 w-1/3 bg-gradient-to-l from-blue-400/10 to-transparent"
      />

      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/20 bg-blue-300/10 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100 sm:text-[11px]">
              {eyebrow}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="break-words text-3xl font-semibold tracking-tight text-white sm:text-[34px]">
              {title}
            </h1>

            {label && (
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-100 sm:text-[11px]">
                {label}
              </span>
            )}
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-[15px]">
            {subtitle}
          </p>

          {metadata.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {metadata.map((item, index) => (
                <span
                  key={`${item.label}-${index}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[11px] font-medium text-slate-200 sm:text-xs"
                >
                  {item.dot && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  )}
                  {item.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {action && (
          <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
            {action}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <FolderKanban size={23} />
      </div>

      <h3 className="text-sm font-semibold text-[#101b32]">{title}</h3>

      <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
        {description}
      </p>

      {action}
    </div>
  );
}

function ProjectDetails({ project, onBack }) {
  const clientName =
    project?.client?.name || project?.clientName || "Client not available";

  const deadline = project?.deadline || project?.internalDeadline;

  const progress = Math.max(
    0,
    Math.min(100, Number(project?.progress) || 0),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={project?.name || "Project Details"}
        subtitle="Review project information, deadlines and current development progress."
        label="Project details"
        metadata={[
          { label: `Project ID: ${shortId(project?.uuid || project?.id)}` },
          { label: clientName },
        ]}
        action={
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[10px] border border-white/20 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/15"
          >
            <ArrowLeft size={15} />
            Back to projects
          </button>
        }
      />

      {/* Project information */}
      <section className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-[#101b32]">
              Project information
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Basic project details and current status.
            </p>
          </div>

          <StatusBadge status={project?.status} />
        </div>

        <div className="p-5 sm:p-6">
          {project?.description && (
            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Description
              </p>

              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {project.description}
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <CalendarDays size={15} />
                Deadline
              </div>

              <p className="mt-2 text-sm font-semibold text-[#101b32]">
                {formatDate(deadline)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Clock3 size={15} />
                Start date
              </div>

              <p className="mt-2 text-sm font-semibold text-[#101b32]">
                {formatDate(project?.startDate)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Users size={15} />
                Project tier
              </div>

              <p className="mt-2 text-sm font-semibold capitalize text-[#101b32]">
                {project?.tier || "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Project progress */}
      <section className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#101b32]">
              Development progress
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Current task-based project completion.
            </p>
          </div>

          <span className="text-xl font-bold tabular-nums text-[#101b32]">
            {progress}%
          </span>
        </div>

        <div className="mt-5">
          <ProgressBar value={progress} />
        </div>
      </section>

      {/* Project alerts */}
      {(project?.isOverdue || project?.isDueSoon) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">
            {project?.isOverdue ? "Project overdue" : "Upcoming deadline"}
          </p>

          <p className="mt-1 text-xs leading-relaxed sm:text-sm">
            {project?.isOverdue
              ? "This project is overdue. Please review the remaining tasks and coordinate with your project lead."
              : `This project is due soon${
                  Number.isFinite(Number(project?.daysLeft))
                    ? ` (${project.daysLeft} days left)`
                    : ""
                }.`}
          </p>
        </div>
      )}

      {/* External project link */}
      {project?.projectUrl && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-[#101b32]">
              Project resource
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Open the external project workspace.
            </p>
          </div>

          <a
            href={project.projectUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[38px] items-center gap-2 rounded-lg bg-[#0b1833] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#17294b]"
          >
            Open project link
            <ExternalLink size={14} />
          </a>
        </section>
      )}
    </div>
  );
}

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState(null);

  // Existing API endpoint retained.
  const getMyProjects = useCallback(async () => {
    const response = await axios.get("/api/operations/my-projects", {
      withCredentials: true,
    });

    if (response.data?.success === false) {
      throw new Error(
        response.data?.message || "Couldn't load your projects.",
      );
    }

    const data = response.data?.data ?? response.data?.projects ?? [];

    return Array.isArray(data) ? data : [];
  }, []);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMyProjects();
      setProjects(data);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Couldn't load your projects."),
      );
    } finally {
      setLoading(false);
    }
  }, [getMyProjects]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Build filter options from actual project statuses.
  const statusOptions = useMemo(() => {
    const statuses = [
      ...new Set(
        projects
          .map((project) => String(project.status || "").trim())
          .filter(Boolean),
      ),
    ];

    return statuses.sort((a, b) => a.localeCompare(b));
  }, [projects]);

  // Search and status filtering.
  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      const clientName =
        project?.client?.name || project?.clientName || "";

      const matchesSearch =
        !query ||
        [
          project?.name,
          clientName,
          project?.status,
          project?.tier,
          project?.uuid,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );

      const matchesStatus =
        statusFilter === "all" ||
        String(project?.status || "").toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProjects.length / PAGE_SIZE),
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // Project details view.
  if (selectedProject) {
    return (
      <main className="flex flex-col gap-6">
        <ProjectDetails
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
        />
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6">
      {/* Standardized page header */}
      <PageHeader
        title="My Projects"
        subtitle="View the projects assigned to you and track their development progress."
        label="Workspace"
        metadata={[
          { label: "Assigned projects", dot: true },
          {
            label: loading
              ? "Loading records..."
              : `${projects.length} project${projects.length === 1 ? "" : "s"}`,
          },
        ]}
        action={
          <button
            type="button"
            onClick={loadProjects}
            disabled={loading}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[10px] border border-white/20 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        }
      />

      {/* Projects overview */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#101b32] sm:text-xl">
              Project Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Browse, search and review your assigned projects.
            </p>
          </div>

          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-500">
            {filteredProjects.length} matching records
          </span>
        </div>

        {/* Search, filters and table */}
        <section className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="relative w-full sm:max-w-md">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects, clients, status..."
                aria-label="Search projects"
                className="h-[40px] w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 sm:text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="project-status-filter"
                className="text-xs font-medium text-slate-500"
              >
                Status
              </label>

              <select
                id="project-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-[40px] min-w-[145px] rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 sm:text-sm"
              >
                <option value="all">All statuses</option>

                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
              <LoaderCircle
                size={20}
                className="animate-spin text-blue-600"
              />
              Loading your projects...
            </div>
          ) : error ? (
            <EmptyState
              title="Couldn't load your projects"
              description={error}
              action={
                <button
                  type="button"
                  onClick={loadProjects}
                  className="mt-4 inline-flex min-h-[38px] items-center gap-2 rounded-lg bg-[#0b1833] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#17294b]"
                >
                  <RefreshCw size={14} />
                  Try again
                </button>
              }
            />
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              title={
                projects.length
                  ? "No matching projects"
                  : "No projects assigned yet"
              }
              description={
                projects.length
                  ? "Try changing your search or status filter."
                  : "Projects assigned to you as a project lead or developer will appear here."
              }
              action={
                (search || statusFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                    }}
                    className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Clear filters
                  </button>
                )
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse text-left">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                      <th className="px-5 py-3.5">Project ID</th>
                      <th className="px-5 py-3.5">Project</th>
                      <th className="px-5 py-3.5">Client</th>
                      <th className="px-5 py-3.5">Deadline</th>
                      <th className="px-5 py-3.5">Progress</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Details</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedProjects.map((project) => (
                      <tr
                        key={project.id || project.uuid}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-500">
                          {shortId(project.uuid || project.id)}
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[220px] truncate text-sm font-semibold text-[#101b32]">
                            {project.name || "Untitled project"}
                          </p>

                          <p className="mt-1 text-[11px] capitalize text-slate-500">
                            {project.tier || "Standard"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-600 sm:text-sm">
                          {project?.client?.name ||
                            project?.clientName ||
                            "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600 sm:text-sm">
                          {formatDate(
                            project.deadline || project.internalDeadline,
                          )}

                          {project.isOverdue && (
                            <span className="mt-1 block text-[11px] font-semibold text-rose-600">
                              Overdue
                            </span>
                          )}

                          {!project.isOverdue && project.isDueSoon && (
                            <span className="mt-1 block text-[11px] font-semibold text-amber-600">
                              Due soon
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <ProgressBar value={project.progress} />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={project.status} />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedProject(project)}
                            className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            View
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(
                    currentPage * PAGE_SIZE,
                    filteredProjects.length,
                  )}{" "}
                  of {filteredProjects.length} projects
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() =>
                      setPage((value) => Math.max(1, value - 1))
                    }
                    className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>

                  <span className="min-w-14 text-center text-xs font-medium tabular-nums text-slate-500">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setPage((value) =>
                        Math.min(totalPages, value + 1),
                      )
                    }
                    className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}