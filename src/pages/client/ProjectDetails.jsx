import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  FolderKanban,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

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

  const [year, month, day] = String(date)
    .slice(0, 10)
    .split("-")
    .map(Number);

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

const getProgress = (value) =>
  Math.min(100, Math.max(0, Number(value) || 0));

const getDocumentUrl = (version) =>
  version?.viewUrl ||
  (version?.uuid ? `/api/brds/versions/${version.uuid}/file` : null);

// ---------------------------------------------------------------------------
// Small UI Helpers
// ---------------------------------------------------------------------------

function CloseIcon() {
  return (
    <X
      aria-hidden="true"
      className="h-5 w-5"
      strokeWidth={1.8}
    />
  );
}

function FileIcon() {
  return (
    <FileText
      aria-hidden="true"
      className="h-5 w-5"
      strokeWidth={1.8}
    />
  );
}

function ProgressBar({ value = 0 }) {
  const progress = getProgress(value);

  return (
    <div className="flex min-w-[112px] items-center gap-2">
      <div
        className="h-2 w-20 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Project progress"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-700 to-indigo-600 transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="text-xs font-medium tabular-nums text-cm-text-muted">
        {progress}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable Modal Shell
// Shared by Project Details and BRD Document Viewer
// ---------------------------------------------------------------------------

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  size = "max-w-4xl",
  icon: Icon = FileIcon,
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full ${size} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl`}
      >
        {/* Branded Modal Header */}
        <header className="relative isolate overflow-hidden border-b border-slate-700 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-5 py-5 text-white sm:px-6 sm:py-6">
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
            className="pointer-events-none absolute right-0 top-0 h-48 w-48 bg-blue-500/10 blur-3xl"
          />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100">
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                  CLIENT WORKSPACE
                </p>

                <h2 className="mt-1 break-words text-lg font-bold tracking-tight text-white sm:text-xl">
                  {title}
                </h2>

                {subtitle && (
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-slate-200 transition hover:border-white/25 hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <CloseIcon />
            </button>
          </div>
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
      icon={FolderKanban}
    >
      <div className="overflow-y-auto bg-white p-5 sm:p-6">
        {/* Project Status */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[project.status] || "neutral"}>
            {project.status || "Unknown"}
          </Badge>

          {project.tier && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {project.tier}
            </span>
          )}
        </div>

        {/* Project Description */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-800">
              <BriefcaseBusiness className="h-4 w-4" />
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
              About this project
            </p>
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {project.description || "No project description has been provided."}
          </p>
        </div>

        {/* Project Information */}
        <section className="mt-6">
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Project information
            </p>

            <h3 className="mt-1 text-sm font-bold text-cm-navy-950">
              Key project details
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {detailItems.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/20"
              >
                <p className="text-xs font-medium text-slate-500">
                  {item.label}
                </p>

                <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Overall Progress */}
        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
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

          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-700 to-indigo-600 transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {/* Business Requirement Document */}
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-800">
                <FileIcon />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-800">
                  Project documentation
                </p>

                <h3 className="mt-1 text-sm font-bold text-cm-navy-950">
                  Business Requirement Document
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Documents and uploaded versions for this project
                </p>
              </div>
            </div>

            {brd?.status && <Badge tone="neutral">{brd.status}</Badge>}
          </div>

          {!brd ? (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-8 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-800">
                <FileIcon />
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No BRD uploaded yet
              </p>

              <p className="mt-1 text-xs text-slate-500">
                The document will appear here once it has been uploaded.
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
                  <FileIcon />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {brd.title || "Business Requirement Document"}
                  </p>

                  {brd.description && (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {brd.description}
                    </p>
                  )}
                </div>
              </div>

              {versions.length === 0 ? (
                <p className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-500">
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
                        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition hover:border-blue-200 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-800">
                            <FileIcon />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {version.fileName || `Version ${version.version}`}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
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
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-cm-navy-950 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FileText className="h-3.5 w-3.5" />
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

      {/* Project Details Footer */}
      <footer className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-cm-navy-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      icon={FileText}
    >
      <div className="flex min-h-[55vh] flex-1 flex-col bg-slate-50">
        {document.loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-800" />

            <p className="text-sm font-medium text-slate-700">
              Loading document…
            </p>
          </div>
        ) : document.error ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-800">
              <FileIcon />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-800">
              Couldn't preview this document
            </p>

            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
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
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-800 shadow-sm">
                <FileIcon />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-800">
                Preview isn't supported for this file type
              </p>

              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                This file can still be opened or downloaded using the action
                below.
              </p>

              <a
                href={document.url}
                download={document.fileName || "document"}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cm-navy-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
              >
                <FileText className="h-4 w-4" />
                Download document
              </a>
            </div>
          )
        ) : null}
      </div>

      {/* Document Viewer Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 sm:px-6">
        <p className="min-w-0 truncate text-xs font-medium text-slate-500">
          {document.fileName || "BRD document"}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-cm-navy-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
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

  // Fetch client projects.
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

  // Search projects.
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

  // Open a BRD version using the authenticated Axios request.
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
      // Axios applies the configured Bearer-token interceptors.
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

  // -------------------------------------------------------------------------
  // Project Table Columns
  // -------------------------------------------------------------------------

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
          className="inline-flex items-center justify-center rounded-lg bg-cm-navy-950 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
        >
          View details
        </button>
      ),
    },
  ];

  // -------------------------------------------------------------------------
  // Main Page
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Client Projects Page Header */}
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
              My Projects
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Track project progress, key dates, ownership and your business
              requirement documents in one place.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-semibold text-white">
                Project portfolio
              </p>

              <p className="mt-0.5 text-[11px] text-slate-300">
                {isLoading ? "Loading projects…" : `${projects.length} projects found`}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Error State */}
      {loadError ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <ErrorState
            title="Couldn't load projects"
            description={loadError}
            onRetry={reload}
          />
        </div>
      ) : (
        <>
          {/* Project Portfolio */}
          <section className="overflow-hidden rounded-2xl border border-cm-border bg-cm-card shadow-sm">
            {/* Portfolio Section Header */}
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-800">
                  <Layers3 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-800">
                    Delivery tracker
                  </p>

                  <h2 className="mt-1 text-base font-bold text-cm-navy-950">
                    Project portfolio
                  </h2>

                  <p className="mt-1 text-xs text-cm-text-muted">
                    Select a project to view its details and BRD versions.
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-80">
                <TableSearch
                  value={search}
                  onChange={setSearch}
                  placeholder="Search projects..."
                />
              </div>
            </div>

            {/* Project Table */}
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
        </>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onViewDocument={openDocument}
        />
      )}

      {/* BRD Document Viewer Modal */}
      {document && (
        <DocumentViewerModal
          document={document}
          onClose={closeDocument}
        />
      )}
    </div>
  );
}
