import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import Badge from "../../components/common/Badge";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import ErrorState from "../../components/common/ErrorState";

// ---------------------------------------------------------------------------
// Constants + Helpers
// ---------------------------------------------------------------------------

const STATUS_TONE = {
  Planning: "neutral",
  "In Development": "neutral",
  Testing: "warning",
  Completed: "success",
  "On Hold": "warning",
  Cancelled: "danger",
};

const formatDate = (date) => {
  if (!date) return "—";

  const [year, month, day] = String(date).slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) return "—";

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatFileSize = (bytes) => {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return null;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const shortId = (uuid) => {
  if (!uuid) return "—";
  return `PRJ-${String(uuid).slice(0, 6).toUpperCase()}`;
};

const getProgress = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const getDocumentUrl = (version) =>
  version?.viewUrl ||
  (version?.uuid ? `/api/brds/versions/${version.uuid}/file` : null);

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 3v7h7M8 15h8M8 18h5"
      />
    </svg>
  );
}

function ProgressBar({ value = 0 }) {
  const progress = getProgress(value);

  return (
    <div className="flex min-w-[112px] items-center gap-2">
      <div
        className="h-2 w-20 overflow-hidden rounded-full bg-cm-border"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Project progress"
      >
        <div
          className="h-full rounded-full bg-cm-navy-950 transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums text-cm-text-muted">
        {progress}%
      </span>
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  size = "max-w-4xl",
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

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
        aria-label={title}
        className={`flex max-h-[92vh] w-full ${size} flex-col overflow-hidden rounded-2xl border border-cm-border bg-cm-card shadow-2xl`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-cm-border bg-cm-card px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-cm-navy-950 sm:text-lg">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs text-cm-text-muted">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-cm-text-muted transition hover:bg-cm-bg hover:text-cm-navy-950 focus:outline-none focus:ring-2 focus:ring-cm-navy-950"
          >
            <CloseIcon />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Project Details Modal
// ---------------------------------------------------------------------------

function ProjectDetailsModal({ project, onClose, onViewDocument }) {
  const brd = project.brd;
  const versions = brd?.versions || [];
  const progress = getProgress(project.progress);

  const detailItems = [
    {
      label: "Project lead",
      value: project.projectLead?.fullName || "Unassigned",
    },
    { label: "Project tier", value: project.tier || "—" },
    { label: "Project type", value: project.projectType || "—" },
    { label: "Deadline", value: formatDate(project.deadline) },
    { label: "Start date", value: formatDate(project.startDate) },
    { label: "Created on", value: formatDate(project.createdAt) },
  ];

  return (
    <ModalShell
      title={project.name || "Project details"}
      subtitle={`${shortId(project.uuid)} · Project overview`}
      onClose={onClose}
    >
      <div className="overflow-y-auto p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[project.status] || "neutral"}>
            {project.status || "Unknown"}
          </Badge>
          {project.tier && (
            <span className="rounded-full border border-cm-border px-3 py-1 text-xs font-medium text-cm-text-muted">
              {project.tier}
            </span>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-cm-border bg-cm-bg/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-cm-text-muted">
            About this project
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-cm-text">
            {project.description || "No project description has been provided."}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {detailItems.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-cm-border p-4"
            >
              <p className="text-xs font-medium text-cm-text-muted">
                {item.label}
              </p>
              <p className="mt-1.5 break-words text-sm font-semibold text-cm-text">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-cm-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-cm-navy-950">
                Overall progress
              </p>
              <p className="mt-1 text-xs text-cm-text-muted">
                Current project completion
              </p>
            </div>
            <span className="text-lg font-bold tabular-nums text-cm-navy-950">
              {progress}%
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-cm-border">
            <div
              className="h-full rounded-full bg-cm-navy-950 transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-cm-navy-950">
                Business Requirement Document
              </h3>
              <p className="mt-1 text-xs text-cm-text-muted">
                Documents and uploaded versions for this project
              </p>
            </div>
            {brd?.status && <Badge tone="neutral">{brd.status}</Badge>}
          </div>

          {!brd ? (
            <div className="mt-3 rounded-xl border border-dashed border-cm-border px-4 py-8 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-cm-bg text-cm-navy-950">
                <FileIcon />
              </div>
              <p className="mt-3 text-sm font-medium text-cm-text">
                No BRD uploaded yet
              </p>
              <p className="mt-1 text-xs text-cm-text-muted">
                The document will appear here once it has been uploaded.
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-cm-border p-4">
              <p className="text-sm font-semibold text-cm-text">
                {brd.title || "Business Requirement Document"}
              </p>
              {brd.description && (
                <p className="mt-1 text-xs leading-5 text-cm-text-muted">
                  {brd.description}
                </p>
              )}

              {versions.length === 0 ? (
                <p className="mt-4 rounded-lg bg-cm-bg p-3 text-sm text-cm-text-muted">
                  No uploaded versions are available.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {versions.map((version) => {
                    const fileUrl = getDocumentUrl(version);
                    const fileSize = formatFileSize(version.fileSize);

                    return (
                      <div
                        key={version.uuid || version.version}
                        className="flex flex-col gap-3 rounded-xl border border-cm-border bg-cm-bg/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cm-card text-cm-navy-950">
                            <FileIcon />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-cm-text">
                              {version.fileName || `Version ${version.version}`}
                            </p>
                            <p className="mt-1 text-xs text-cm-text-muted">
                              Version {version.version ?? "—"}
                              {version.createdAt || version.uploadedAt
                                ? ` · ${formatDate(version.uploadedAt || version.createdAt)}`
                                : ""}
                              {fileSize ? ` · ${fileSize}` : ""}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!fileUrl}
                          onClick={() => onViewDocument(version)}
                          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-cm-navy-950 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-cm-navy-950/90 focus:outline-none focus:ring-2 focus:ring-cm-navy-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          View document
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <footer className="flex justify-end border-t border-cm-border bg-cm-bg/50 px-5 py-3 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-cm-border px-4 py-2 text-sm font-semibold text-cm-text transition hover:bg-cm-bg focus:outline-none focus:ring-2 focus:ring-cm-navy-950"
        >
          Done
        </button>
      </footer>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// BRD Document Viewer Modal
// ---------------------------------------------------------------------------

function DocumentViewerModal({ document, onClose }) {
  return (
    <ModalShell
      title={document.fileName || "BRD document"}
      subtitle="Secure document preview"
      onClose={onClose}
      size="max-w-6xl"
    >
      <div className="flex min-h-[55vh] flex-1 flex-col bg-cm-bg">
        {document.loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-cm-border border-t-cm-navy-950" />
            <p className="text-sm font-medium text-cm-text">
              Loading document…
            </p>
          </div>
        ) : document.error ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cm-card text-cm-navy-950">
              <FileIcon />
            </div>
            <p className="mt-4 text-sm font-semibold text-cm-text">
              Couldn't preview this document
            </p>
            <p className="mt-1 max-w-md text-sm text-cm-text-muted">
              {document.error}
            </p>
          </div>
        ) : document.url ? (
          document.mimeType === "application/pdf" ||
          document.mimeType?.startsWith("image/") ? (
            <iframe
              title={document.fileName || "BRD document preview"}
              src={document.url}
              className="min-h-[65vh] w-full flex-1 bg-white"
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cm-card text-cm-navy-950">
                <FileIcon />
              </div>
              <p className="mt-4 text-sm font-semibold text-cm-text">
                Preview isn't supported for this file type
              </p>
              <p className="mt-1 max-w-md text-sm text-cm-text-muted">
                This file can still be opened or downloaded using the action
                below.
              </p>
              <a
                href={document.url}
                download={document.fileName || "document"}
                className="mt-5 inline-flex items-center rounded-lg bg-cm-navy-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cm-navy-950/90"
              >
                Download document
              </a>
            </div>
          )
        ) : null}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-cm-border bg-cm-card px-5 py-3 sm:px-6">
        <p className="min-w-0 truncate text-xs text-cm-text-muted">
          {document.fileName || "BRD document"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-cm-navy-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cm-navy-950/90 focus:outline-none focus:ring-2 focus:ring-cm-navy-950 focus:ring-offset-2"
        >
          Close viewer
        </button>
      </footer>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Main Client Project Page
// ---------------------------------------------------------------------------

export default function ProjectDetails() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [document, setDocument] = useState(null);

  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Revoke the temporary authenticated-file URL whenever it changes or closes.
  useEffect(() => {
    if (!document?.url) return undefined;
    return () => URL.revokeObjectURL(document.url);
  }, [document?.url]);

  useEffect(() => {
    let ignore = false;

    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await axios.get("/api/client/projects", {
          params: { page: 1, limit: 100 },
        });

        const responseData = response.data?.data;
        const projectList = Array.isArray(responseData)
          ? responseData
          : responseData?.projects ||
            responseData?.rows ||
            responseData?.items ||
            [];

        if (!ignore) setProjects(projectList);
      } catch (error) {
        if (!ignore) {
          setLoadError(
            error.response?.data?.message || "Couldn't load your projects.",
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchProjects();

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const reload = () => {
    setIsLoading(true);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  };

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;

    return projects.filter((project) =>
      [
        project.name,
        project.status,
        project.tier,
        project.projectType,
        project.projectLead?.fullName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [projects, search]);

  const openDocument = async (version) => {
    const fileUrl = getDocumentUrl(version);
    if (!fileUrl) return;

    setDocument({
      fileName: version.fileName || `BRD-Version-${version.version || ""}`,
      mimeType: version.mimeType || "",
      loading: true,
      error: null,
      url: null,
    });

    try {
      // Axios is used instead of a plain anchor so configured Bearer-token
      // interceptors are applied to the authenticated file request.
      const response = await axios.get(fileUrl, { responseType: "blob" });
      const mimeType =
        version.mimeType || response.data?.type || "application/octet-stream";
      const blob = new Blob([response.data], { type: mimeType });
      const url = URL.createObjectURL(blob);

      setDocument((current) => {
        if (!current) {
          URL.revokeObjectURL(url);
          return current;
        }
        return { ...current, loading: false, error: null, url, mimeType };
      });
    } catch (error) {
      setDocument((current) =>
        current
          ? {
              ...current,
              loading: false,
              error:
                error.response?.data?.message ||
                "The file could not be loaded. Check your access or try again.",
            }
          : current,
      );
    }
  };

  const closeDocument = () => setDocument(null);

  const columns = [
    {
      key: "projectId",
      header: "Project ID",
      render: (row) => (
        <span className="text-xs font-medium text-cm-text-muted">
          {shortId(row.uuid)}
        </span>
      ),
    },
    {
      key: "name",
      header: "Project",
      render: (row) => (
        <span className="font-semibold text-cm-navy-950">{row.name}</span>
      ),
    },
    {
      key: "lead",
      header: "Project Lead",
      render: (row) =>
        row.projectLead?.fullName || (
          <span className="text-cm-text-muted">Unassigned</span>
        ),
    },
    {
      key: "tier",
      header: "Tier",
      render: (row) => row.tier || "—",
    },
    {
      key: "deadline",
      header: "Deadline",
      render: (row) => formatDate(row.deadline),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={STATUS_TONE[row.status] || "neutral"}>
          {row.status || "Unknown"}
        </Badge>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      render: (row) => <ProgressBar value={row.progress} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedProject(row)}
          className="inline-flex items-center justify-center rounded-lg bg-cm-navy-950 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-cm-navy-950/90 focus:outline-none focus:ring-2 focus:ring-cm-navy-950 focus:ring-offset-2"
        >
          View details
        </button>
      ),
    },
  ];

  if (loadError) {
    return (
      <div className="rounded-2xl border border-cm-border bg-cm-card p-2">
        <ErrorState
          title="Couldn't load projects"
          description={loadError}
          onRetry={reload}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-cm-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cm-navy-950">
            Client workspace
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-cm-navy-950 sm:text-3xl">
            My Projects
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-cm-text-muted">
            Track project progress, key dates, ownership and your business
            requirement documents in one place.
          </p>
        </div>

        <div className="rounded-xl border border-cm-border bg-cm-card px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-cm-text-muted">
            Projects found
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-cm-navy-950">
            {isLoading ? "—" : projects.length}
          </p>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-cm-border bg-cm-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-cm-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-bold text-cm-navy-950">
              Project portfolio
            </h2>
            <p className="mt-1 text-xs text-cm-text-muted">
              Select a project to view its details and BRD versions.
            </p>
          </div>

          <div className="w-full sm:w-80">
            <TableSearch
              value={search}
              onChange={setSearch}
              placeholder="Search projects..."
            />
          </div>
        </div>

        <div className="p-3 sm:p-5">
          <DataTable
            columns={columns}
            rows={filteredProjects.map((project) => ({
              ...project,
              id: project.uuid,
            }))}
            isLoading={isLoading}
            emptyMessage={
              search
                ? "No projects match your search."
                : "No projects assigned to you yet."
            }
          />
        </div>
      </section>

      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onViewDocument={openDocument}
        />
      )}

      {document && (
        <DocumentViewerModal document={document} onClose={closeDocument} />
      )}
    </div>
  );
}
