import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Loader from "../../components/common/Loader";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";

const STATUS_TONE = {
  Approved: "success",
  Rejected: "danger",
  Pending: "warning",
};

const HISTORY_FILTERS = ["All", "Approved", "Rejected", "Pending"];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function BRDUpload() {
  const [activeTab, setActiveTab] = useState("upload");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [projects, setProjects] = useState([]);
  const [brdData, setBrdData] = useState([]);

  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    currentStatus: "All BRDs Reviewed",
  });

  const [selectedProject, setSelectedProject] = useState("");
  const [file, setFile] = useState(null);

  const [search, setSearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("All");

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fileInputRef = useRef(null);

  async function fetchProjects() {
    try {
      setLoadingProjects(true);

      const response = await axios.get("/api/brds/projects", {
        withCredentials: true,
      });

      setProjects(response.data.data || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load projects",
      );
    } finally {
      setLoadingProjects(false);
    }
  }

  async function fetchBRDSummary() {
    try {
      setLoadingSummary(true);

      const response = await axios.get("/api/brds/summary", {
        withCredentials: true,
      });

      setSummary(
        response.data.data || {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          currentStatus: "All BRDs Reviewed",
        },
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load BRD summary",
      );
    } finally {
      setLoadingSummary(false);
    }
  }

  async function fetchBRDHistory() {
    try {
      setLoadingHistory(true);

      const response = await axios.get("/api/brds/history", {
        withCredentials: true,
      });

      setBrdData(response.data.data || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load BRD history",
      );
    } finally {
      setLoadingHistory(false);
    }
  }

  async function loadBRDData() {
    setError("");

    await Promise.all([fetchProjects(), fetchBRDSummary(), fetchBRDHistory()]);
  }

  useEffect(() => {
    loadBRDData();
  }, []);

  function openUploadModal() {
    setError("");
    setSuccessMessage("");
    setActiveTab("upload");
    setIsUploadModalOpen(true);
  }

  function closeUploadModal() {
    if (uploading) return;
    setIsUploadModalOpen(false);
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    setError("");
    setSuccessMessage("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setFile(null);
      event.target.value = "";
      setError("Only PDF, DOC, and DOCX files are allowed.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      event.target.value = "";
      setError("File size must not exceed 10 MB.");
      return;
    }

    setFile(selectedFile);
  }

  async function handleUpload(event) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!selectedProject) {
      setError("Please select a project.");
      return;
    }

    if (!file) {
      setError("Please select a BRD file.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("projectUuid", selectedProject);
      formData.append("brdFile", file);

      await axios.post("/api/brds", formData, {
        withCredentials: true,
      });

      setSuccessMessage("BRD uploaded and submitted for admin approval.");

      setSelectedProject("");
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await Promise.all([fetchBRDSummary(), fetchBRDHistory()]);

      setIsUploadModalOpen(false);
      setActiveTab("history");
      setHistoryFilter("All");
      setSearch("");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to upload BRD",
      );
    } finally {
      setUploading(false);
    }
  }

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();

    return brdData.filter((item) => {
      const matchesStatus =
        historyFilter === "All" || item.status === historyFilter;

      const matchesSearch =
        !query ||
        item.project?.toLowerCase().includes(query) ||
        item.client?.toLowerCase().includes(query) ||
        item.fileName?.toLowerCase().includes(query) ||
        item.uploadedBy?.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [brdData, historyFilter, search]);

  const columns = [
    {
      key: "project",
      header: "Project",
      render: (row) => (
        <div>
          <p className="font-medium text-cm-text">{row.project}</p>
          <p className="text-xs text-cm-text-muted">{row.client}</p>
        </div>
      ),
    },
    {
      key: "fileName",
      header: "BRD",
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-cm-text">{row.fileName}</p>
          <p className="text-xs text-cm-text-muted">{row.version}</p>
        </div>
      ),
    },
    {
      key: "uploadedBy",
      header: "Uploaded By",
      render: (row) => (
        <div>
          <p className="text-sm text-cm-text">{row.uploadedBy}</p>
          <p className="text-xs text-cm-text-muted">
            {formatDate(row.uploadedAt)}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={STATUS_TONE[row.status] || "neutral"}>{row.status}</Badge>
      ),
    },
    {
      key: "reviewedBy",
      header: "Reviewed By",
      render: (row) => (
        <div>
          <p className="text-sm text-cm-text">{row.reviewedBy || "—"}</p>
          <p className="text-xs text-cm-text-muted">
            {formatDate(row.reviewedAt)}
          </p>
        </div>
      ),
    },
    {
      key: "remarks",
      header: "Remarks",
      render: (row) => (
        <span className="text-sm text-cm-text-muted">{row.remarks || "—"}</span>
      ),
    },
    {
      key: "action",
      header: "",
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            window.open(
              `/api/brds/versions/${row.id}/file`,
              "_blank",
              "noopener,noreferrer",
            );
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Standardized Page Header */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              BUSINESS DEVELOPMENT
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
              BRD Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Upload project BRDs and track approval status and history.
            </p>
          </div>

          <Button onClick={openUploadModal}>
            Upload BRD
          </Button>
        </div>
      </div>

      {/* Upload BRD / History Tabs */}
      <div className="flex flex-wrap items-center gap-3 border-b border-cm-border pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === "upload"
              ? "bg-[#0b1734] text-white shadow-md shadow-slate-900/20"
              : "border border-cm-border bg-cm-card text-cm-text-muted hover:border-[#0b1734] hover:text-[#0b1734]"
          }`}
        >
          Upload BRD
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("history");
            fetchBRDHistory();
          }}
          className={`rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 ${
            activeTab === "history"
              ? "bg-[#0b1734] text-white shadow-md shadow-slate-900/20"
              : "border border-cm-border bg-cm-card text-cm-text-muted hover:border-[#0b1734] hover:text-[#0b1734]"
          }`}
        >
          History
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
          {successMessage}
        </div>
      )}

      {/* Upload Tab: BRD Status */}
      {activeTab === "upload" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm lg:col-span-2">
            <div>
              <h2 className="text-base font-semibold text-cm-text">
                Business Requirements Documents
              </h2>
              <p className="mt-1 text-sm text-cm-text-muted">
                Submit a project BRD for admin approval and monitor its review
                status.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-cm-border bg-cm-background p-4">
              <div>
                <p className="text-sm font-medium text-cm-text">
                  Ready to submit a BRD?
                </p>
                <p className="mt-1 text-xs text-cm-text-muted">
                  PDF, DOC, and DOCX files up to 10 MB are supported.
                </p>
              </div>

              <Button onClick={openUploadModal}>
                Upload BRD
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-cm-text">BRD Status</h2>

            {loadingSummary ? (
              <Loader context="section" label="Loading BRD status..." />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-cm-lg border border-cm-border bg-cm-card p-4">
                    <p className="text-xs text-cm-text-muted">Total</p>
                    <p className="mt-1 text-2xl font-bold text-cm-text">
                      {summary.total}
                    </p>
                  </div>

                  <div className="rounded-cm-lg border border-cm-border bg-cm-card p-4">
                    <p className="text-xs text-cm-text-muted">Pending</p>
                    <p className="mt-1 text-2xl font-bold text-cm-warning-600">
                      {summary.pending}
                    </p>
                  </div>

                  <div className="rounded-cm-lg border border-cm-border bg-cm-card p-4">
                    <p className="text-xs text-cm-text-muted">Approved</p>
                    <p className="mt-1 text-2xl font-bold text-cm-success-600">
                      {summary.approved}
                    </p>
                  </div>

                  <div className="rounded-cm-lg border border-cm-border bg-cm-card p-4">
                    <p className="text-xs text-cm-text-muted">Rejected</p>
                    <p className="mt-1 text-2xl font-bold text-cm-danger-600">
                      {summary.rejected}
                    </p>
                  </div>
                </div>

                <div className="rounded-cm-lg border border-cm-border bg-cm-card p-5">
                  <p className="text-xs text-cm-text-muted">Current Status</p>
                  <div className="mt-3">
                    <Badge tone={summary.pending > 0 ? "warning" : "success"}>
                      {summary.currentStatus}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-cm-text">
                BRD History
              </h2>
              <p className="mt-1 text-xs text-cm-text-muted">
                View all uploaded BRDs and their approval status.
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={openUploadModal}
            >
              Upload New BRD
            </Button>
          </div>

          <TableSearch
            value={search}
            onChange={setSearch}
            placeholder="Search project, client, file..."
          />

          <div className="flex flex-wrap gap-2">
            {HISTORY_FILTERS.map((filter) => {
              const count =
                filter === "All"
                  ? summary.total
                  : filter === "Approved"
                    ? summary.approved
                    : filter === "Rejected"
                      ? summary.rejected
                      : summary.pending;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setHistoryFilter(filter)}
                  className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                    historyFilter === filter
                      ? "border-cm-primary bg-cm-blue-100 text-cm-primary"
                      : "border-cm-border bg-cm-card text-cm-text-muted hover:border-cm-primary hover:text-cm-primary"
                  }`}
                >
                  {filter}
                  <span className="ml-2">{count}</span>
                </button>
              );
            })}
          </div>

          {loadingHistory ? (
            <Loader context="section" label="Loading BRD history..." />
          ) : (
            <DataTable
              columns={columns}
              rows={filteredHistory}
              emptyMessage={
                search || historyFilter !== "All"
                  ? "No BRD history matches your filters."
                  : "No BRD history found."
              }
            />
          )}
        </div>
      )}

      {/* Standardized Upload Modal */}
      {isUploadModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeUploadModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="brd-upload-modal-title"
            className="relative my-auto w-full max-w-3xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-6 sm:px-8">
              <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-blue-500/10 blur-3xl" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                    BUSINESS DEVELOPMENT
                  </span>

                  <h2
                    id="brd-upload-modal-title"
                    className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-[28px]"
                  >
                    Upload Business Requirements Document
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Select the project and attach its latest BRD for admin
                    approval.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeUploadModal}
                  disabled={uploading}
                  aria-label="Close upload modal"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={handleUpload}
              className="flex max-h-[calc(100vh-220px)] flex-col overflow-y-auto"
            >
              <div className="flex flex-col gap-5 p-6 sm:p-8">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="project"
                    className="text-sm font-medium text-cm-text"
                  >
                    Project <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="project"
                    value={selectedProject}
                    onChange={(event) =>
                      setSelectedProject(event.target.value)
                    }
                    disabled={loadingProjects || uploading}
                    className="w-full rounded-md border border-cm-border bg-cm-card px-3 py-2 text-sm text-cm-text outline-none focus:border-cm-primary focus:ring-1 focus:ring-cm-primary"
                  >
                    <option value="">Select a project</option>

                    {projects.map((project) => (
                      <option key={project.uuid} value={project.uuid}>
                        {project.name}
                      </option>
                    ))}
                  </select>

                  {loadingProjects && <Loader context="inline" />}
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="brd-file"
                    className="text-sm font-medium text-cm-text"
                  >
                    BRD File <span className="text-red-500">*</span>
                  </label>

                  <input
                    ref={fileInputRef}
                    id="brd-file"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    disabled={uploading}
                    onChange={handleFileChange}
                    className="block w-full rounded-md border border-cm-border bg-cm-card px-3 py-2 text-sm text-cm-text file:mr-4 file:rounded-md file:border-0 file:bg-cm-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                  />

                  <p className="text-xs text-cm-text-muted">
                    Supported formats: PDF, DOC, DOCX. Maximum size: 10 MB.
                  </p>
                </div>

                {file && (
                  <div className="rounded-md border border-cm-border bg-cm-background p-4">
                    <p className="text-xs text-cm-text-muted">
                      Selected file
                    </p>

                    <p className="mt-1 text-sm font-medium text-cm-text">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-cm-text-muted">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}

                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-cm-border bg-cm-background px-6 py-4 sm:px-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeUploadModal}
                  disabled={uploading}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={loadingProjects || uploading}>
                  {uploading ? (
                    <Loader context="inline" />
                  ) : (
                    "Upload BRD"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BRDUpload;
