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
      <div>
        <h1 className="text-xl font-bold text-cm-text">BRD Management</h1>

        <p className="mt-1 text-sm text-cm-text-muted">
          Upload project BRDs and track approval status and history.
        </p>
      </div>

      <div className="border-b border-cm-border">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`border-b-2 px-1 pb-3 text-sm font-medium transition ${
              activeTab === "upload"
                ? "border-cm-primary text-cm-primary"
                : "border-transparent text-cm-text-muted hover:text-cm-text"
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
            className={`border-b-2 px-1 pb-3 text-sm font-medium transition ${
              activeTab === "history"
                ? "border-cm-primary text-cm-primary"
                : "border-transparent text-cm-text-muted hover:text-cm-text"
            }`}
          >
            History
          </button>
        </div>
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

      {activeTab === "upload" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleUpload}
            className="flex flex-col gap-5 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm lg:col-span-2"
          >
            <div>
              <h2 className="text-sm font-semibold text-cm-text">
                Upload Business Requirements Document
              </h2>

              <p className="mt-1 text-xs text-cm-text-muted">
                Select a project and upload the latest BRD document.
              </p>
            </div>

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
                onChange={(event) => setSelectedProject(event.target.value)}
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
                <p className="text-xs text-cm-text-muted">Selected file</p>

                <p className="mt-1 text-sm font-medium text-cm-text">
                  {file.name}
                </p>

                <p className="mt-1 text-xs text-cm-text-muted">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}

            <div className="flex justify-end border-t border-cm-border pt-4">
              <Button type="submit" disabled={loadingProjects}>
                {uploading ? <Loader context="inline" /> : "Upload BRD"}
              </Button>
            </div>
          </form>

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
              onClick={() => setActiveTab("upload")}
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
    </div>
  );
}

export default BRDUpload;
