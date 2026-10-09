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
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${getStatusTone(
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
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-cm-border/60">
        <div
          className="h-full rounded-full bg-[#000052] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="w-9 text-right text-xs font-medium tabular-nums text-cm-text-muted">
        {progress}%
      </span>
    </div>
  );
}

function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cm-bg text-cm-text-muted">
        <FolderKanban size={26} />
      </div>
      <h3 className="text-base font-semibold text-cm-text">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-cm-text-muted">{description}</p>
      {action}
    </div>
  );
}

function ProjectDetails({ project, onBack }) {
  const clientName =
    project?.client?.name || project?.clientName || "Client not available";
  const deadline = project?.deadline || project?.internalDeadline;

  return (
    <section className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-cm-text-muted transition hover:text-cm-text"
      >
        <ArrowLeft size={16} />
        Back to my projects
      </button>

      <div className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-cm-text-muted">
              Project {shortId(project?.uuid || project?.id)}
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold text-cm-text">
              {project?.name || "Untitled project"}
            </h1>
            <p className="mt-2 text-sm text-cm-text-muted">{clientName}</p>
          </div>
          <StatusBadge status={project?.status} />
        </div>

        {project?.description && (
          <p className="mt-6 whitespace-pre-wrap text-sm leading-6 text-cm-text-muted">
            {project.description}
          </p>
        )}

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-cm-md border border-cm-border p-4">
            <div className="flex items-center gap-2 text-sm text-cm-text-muted">
              <CalendarDays size={16} />
              Deadline
            </div>
            <p className="mt-2 font-medium text-cm-text">
              {formatDate(deadline)}
            </p>
          </div>
          <div className="rounded-cm-md border border-cm-border p-4">
            <div className="flex items-center gap-2 text-sm text-cm-text-muted">
              <Clock3 size={16} />
              Start date
            </div>
            <p className="mt-2 font-medium text-cm-text">
              {formatDate(project?.startDate)}
            </p>
          </div>
          <div className="rounded-cm-md border border-cm-border p-4">
            <div className="flex items-center gap-2 text-sm text-cm-text-muted">
              <Users size={16} />
              Project tier
            </div>
            <p className="mt-2 font-medium capitalize text-cm-text">
              {project?.tier || "—"}
            </p>
          </div>
        </div>

        <div className="mt-7">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-cm-text">
              Project progress
            </h2>
            <span className="text-sm text-cm-text-muted">
              {Math.max(0, Math.min(100, Number(project?.progress) || 0))}%
            </span>
          </div>
          <ProgressBar value={project?.progress} />
        </div>

        {(project?.isOverdue || project?.isDueSoon) && (
          <div className="mt-5 rounded-cm-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {project?.isOverdue
              ? "This project is overdue. Please review the remaining tasks and coordinate with your project lead."
              : `This project is due soon${Number.isFinite(Number(project?.daysLeft)) ? ` (${project.daysLeft} days left)` : ""}.`}
          </div>
        )}

        {project?.projectUrl && (
          <div className="mt-6">
            <a
              href={project.projectUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#000052] hover:underline"
            >
              Open project link <ExternalLink size={15} />
            </a>
          </div>
        )}
      </div>
    </section>
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

  // Keep the request directly in this component; no service import is needed.
  const getMyProjects = useCallback(async () => {
    const response = await axios.get("/api/operations/my-projects", {
      withCredentials: true,
    });

    if (response.data?.success === false) {
      throw new Error(response.data?.message || "Couldn't load your projects.");
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
      setError(getErrorMessage(requestError, "Couldn't load your projects."));
    } finally {
      setLoading(false);
    }
  }, [getMyProjects]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

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

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      const clientName = project?.client?.name || project?.clientName || "";
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

  if (selectedProject) {
    return (
      <main className="space-y-6 p-4 sm:p-6 lg:p-8">
        <ProjectDetails
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
        />
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-cm-text-muted">Workspace</p>
          <h1 className="mt-1 text-2xl font-semibold text-cm-text">
            My Projects
          </h1>
          <p className="mt-2 text-sm text-cm-text-muted">
            View the projects assigned to you and track their progress.
          </p>
        </div>

        <div className="rounded-cm-md border border-cm-border bg-cm-card px-4 py-3">
          <p className="text-xs text-cm-text-muted">Assigned projects</p>
          <p className="mt-1 text-xl font-semibold text-cm-text">
            {loading ? "—" : projects.length}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-cm-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cm-text-muted"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects, clients, status..."
              className="w-full rounded-cm-md border border-cm-border bg-cm-bg py-2.5 pl-9 pr-3 text-sm text-cm-text outline-none transition placeholder:text-cm-text-muted focus:border-[#000052] focus:ring-2 focus:ring-[#000052]/10"
            />
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="project-status-filter"
              className="text-sm text-cm-text-muted"
            >
              Status
            </label>
            <select
              id="project-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-cm-md border border-cm-border bg-cm-bg px-3 py-2.5 text-sm text-cm-text outline-none focus:border-[#000052]"
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
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-cm-text-muted">
            <LoaderCircle size={20} className="animate-spin" />
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
                className="mt-4 rounded-cm-md bg-[#000052] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#000052]/90"
              >
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
                  className="mt-4 rounded-cm-md border border-cm-border px-4 py-2 text-sm font-medium text-cm-text transition hover:bg-cm-bg"
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
                <thead className="bg-cm-bg/70">
                  <tr className="border-b border-cm-border text-xs font-semibold uppercase tracking-wide text-cm-text-muted">
                    <th className="px-5 py-3">Project ID</th>
                    <th className="px-5 py-3">Project</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Deadline</th>
                    <th className="px-5 py-3">Progress</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cm-border">
                  {paginatedProjects.map((project) => (
                    <tr
                      key={project.id || project.uuid}
                      className="transition hover:bg-cm-bg/50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-cm-text-muted">
                        {shortId(project.uuid || project.id)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="max-w-[220px] truncate text-sm font-semibold text-cm-text">
                          {project.name || "Untitled project"}
                        </p>
                        <p className="mt-1 text-xs capitalize text-cm-text-muted">
                          {project.tier || "Standard"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-cm-text">
                        {project?.client?.name || project?.clientName || "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-cm-text-muted">
                        {formatDate(
                          project.deadline || project.internalDeadline,
                        )}
                        {project.isOverdue && (
                          <span className="mt-1 block text-xs font-medium text-rose-600">
                            Overdue
                          </span>
                        )}
                        {!project.isOverdue && project.isDueSoon && (
                          <span className="mt-1 block text-xs font-medium text-amber-600">
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
                          className="inline-flex items-center gap-1 rounded-cm-md border border-cm-border px-3 py-2 text-xs font-semibold text-cm-text transition hover:border-[#000052] hover:text-[#000052]"
                        >
                          View <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-cm-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-cm-text-muted">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filteredProjects.length)} of{" "}
                {filteredProjects.length} projects
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="inline-flex items-center gap-1 rounded-cm-md border border-cm-border px-3 py-2 text-sm text-cm-text transition hover:bg-cm-bg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="min-w-16 text-center text-sm text-cm-text-muted">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  className="inline-flex items-center gap-1 rounded-cm-md border border-cm-border px-3 py-2 text-sm text-cm-text transition hover:bg-cm-bg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
