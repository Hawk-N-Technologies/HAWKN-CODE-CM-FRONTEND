import { useMemo, useState } from "react";

import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Input from "../../components/common/Input";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";

const DUMMY_BRD_DATA = [
  {
    id: 1,
    project: "E-Commerce Website",
    client: "Acme Corporation",
    fileName: "acme-ecommerce-brd.pdf",
    version: "v1.0",
    uploadedBy: "Rahul Sharma",
    uploadedAt: "2026-10-01",
    reviewedBy: "Admin",
    reviewedAt: "2026-10-02",
    status: "Approved",
    remarks: "BRD approved for development.",
  },
  {
    id: 2,
    project: "Mobile Banking App",
    client: "FinTech Solutions",
    fileName: "fintech-mobile-brd.pdf",
    version: "v2.0",
    uploadedBy: "Priya Patel",
    uploadedAt: "2026-10-03",
    reviewedBy: "Admin",
    reviewedAt: "2026-10-04",
    status: "Rejected",
    remarks: "Please update payment workflow and approval process.",
  },
  {
    id: 3,
    project: "HR Management System",
    client: "Global HR Pvt Ltd",
    fileName: "hr-management-brd.pdf",
    version: "v1.0",
    uploadedBy: "Amit Shah",
    uploadedAt: "2026-10-05",
    reviewedBy: null,
    reviewedAt: null,
    status: "Pending",
    remarks: null,
  },
  {
    id: 4,
    project: "Inventory Management",
    client: "ABC Industries",
    fileName: "inventory-brd-v3.pdf",
    version: "v3.0",
    uploadedBy: "Neha Joshi",
    uploadedAt: "2026-09-25",
    reviewedBy: "Admin",
    reviewedAt: "2026-09-27",
    status: "Approved",
    remarks: "Approved after requested changes.",
  },
  {
    id: 5,
    project: "CRM Platform",
    client: "TechNova",
    fileName: "technova-crm-brd.pdf",
    version: "v1.0",
    uploadedBy: "Jay Mehta",
    uploadedAt: "2026-09-28",
    reviewedBy: "Admin",
    reviewedAt: "2026-09-29",
    status: "Rejected",
    remarks: "Missing user role and permission requirements.",
  },
];

const STATUS_TONE = {
  Approved: "success",
  Rejected: "danger",
  Pending: "warning",
};

const HISTORY_FILTERS = ["All", "Approved", "Rejected", "Pending"];

function BRDUpload() {
  const [activeTab, setActiveTab] = useState("upload");

  const [brdData, setBrdData] = useState(DUMMY_BRD_DATA);

  const [search, setSearch] = useState("");

  const [historyFilter, setHistoryFilter] = useState("All");

  const [project, setProject] = useState("");
  const [file, setFile] = useState(null);

  const [uploading, setUploading] = useState(false);

  /**
   * -------------------------------------------------------
   * UPLOAD BRD
   * -------------------------------------------------------
   */
  const handleUpload = async (event) => {
    event.preventDefault();

    if (!project.trim()) {
      alert("Project name is required.");
      return;
    }

    if (!file) {
      alert("Please select a BRD file.");
      return;
    }

    setUploading(true);

    setTimeout(() => {
      const newBRD = {
        id: Date.now(),
        project: project.trim(),
        client: "Dummy Client",
        fileName: file.name,
        version: "v1.0",
        uploadedBy: "Current User",
        uploadedAt: new Date().toISOString().split("T")[0],
        reviewedBy: null,
        reviewedAt: null,
        status: "Pending",
        remarks: null,
      };

      setBrdData((previous) => [newBRD, ...previous]);

      setProject("");
      setFile(null);

      const fileInput = document.getElementById("brd-file");

      if (fileInput) {
        fileInput.value = "";
      }

      setUploading(false);

      setActiveTab("history");
      setHistoryFilter("All");
      setSearch("");
    }, 800);
  };

  /**
   * -------------------------------------------------------
   * FILTER HISTORY
   * -------------------------------------------------------
   */
  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();

    return brdData.filter((item) => {
      const matchesStatus =
        historyFilter === "All" || item.status === historyFilter;

      const matchesSearch =
        !query ||
        item.project.toLowerCase().includes(query) ||
        item.client.toLowerCase().includes(query) ||
        item.fileName.toLowerCase().includes(query) ||
        item.uploadedBy.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [brdData, historyFilter, search]);

  /**
   * -------------------------------------------------------
   * COUNTS
   * -------------------------------------------------------
   */
  const counts = useMemo(
    () => ({
      all: brdData.length,

      approved: brdData.filter((item) => item.status === "Approved").length,

      rejected: brdData.filter((item) => item.status === "Rejected").length,

      pending: brdData.filter((item) => item.status === "Pending").length,
    }),
    [brdData],
  );

  /**
   * -------------------------------------------------------
   * TABLE COLUMNS
   * -------------------------------------------------------
   */
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

          <p className="text-xs text-cm-text-muted">{row.uploadedAt}</p>
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

          <p className="text-xs text-cm-text-muted">{row.reviewedAt || "—"}</p>
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
          onClick={() => alert(`Opening ${row.fileName}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-bold text-cm-text">BRD Management</h1>

        <p className="mt-1 text-sm text-cm-text-muted">
          Upload project BRDs and track approval status and history.
        </p>
      </div>

      {/* TABS */}
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
            onClick={() => setActiveTab("history")}
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

      {/* UPLOAD TAB */}
      {activeTab === "upload" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* UPLOAD FORM */}
          <form
            onSubmit={handleUpload}
            className="flex flex-col gap-5 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm lg:col-span-2"
          >
            <div>
              <h2 className="text-sm font-semibold text-cm-text">
                Upload Business Requirements Document
              </h2>

              <p className="mt-1 text-xs text-cm-text-muted">
                Upload the latest BRD document for a project.
              </p>
            </div>

            <Input
              label="Project"
              required
              placeholder="Enter project name"
              value={project}
              onChange={(event) => setProject(event.target.value)}
            />

            <div className="flex flex-col gap-2">
              <label
                htmlFor="brd-file"
                className="text-sm font-medium text-cm-text"
              >
                BRD File <span className="text-red-500">*</span>
              </label>

              <input
                id="brd-file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className="block w-full rounded-md border border-cm-border bg-cm-card px-3 py-2 text-sm text-cm-text file:mr-4 file:rounded-md file:border-0 file:bg-cm-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
              />

              <p className="text-xs text-cm-text-muted">
                Supported formats: PDF, DOC, DOCX
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
              <Button type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload BRD"}
              </Button>
            </div>
          </form>

          {/* STATUS SUMMARY */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-cm-text">BRD Status</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-cm-lg border border-cm-border bg-cm-card p-4">
                <p className="text-xs text-cm-text-muted">Total</p>

                <p className="mt-1 text-2xl font-bold text-cm-text">
                  {counts.all}
                </p>
              </div>

              <div className="rounded-cm-lg border border-cm-border bg-cm-card p-4">
                <p className="text-xs text-cm-text-muted">Pending</p>

                <p className="mt-1 text-2xl font-bold text-cm-warning-600">
                  {counts.pending}
                </p>
              </div>

              <div className="rounded-cm-lg border border-cm-border bg-cm-card p-4">
                <p className="text-xs text-cm-text-muted">Approved</p>

                <p className="mt-1 text-2xl font-bold text-cm-success-600">
                  {counts.approved}
                </p>
              </div>

              <div className="rounded-cm-lg border border-cm-border bg-cm-card p-4">
                <p className="text-xs text-cm-text-muted">Rejected</p>

                <p className="mt-1 text-2xl font-bold text-cm-danger-600">
                  {counts.rejected}
                </p>
              </div>
            </div>

            <div className="rounded-cm-lg border border-cm-border bg-cm-card p-5">
              <p className="text-xs text-cm-text-muted">Current Status</p>

              <div className="mt-3">
                <Badge tone={counts.pending > 0 ? "warning" : "success"}>
                  {counts.pending > 0
                    ? `${counts.pending} Pending Review`
                    : "All BRDs Reviewed"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div className="flex flex-col gap-5">
          {/* HISTORY HEADER */}
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

          {/* SEARCH */}
          <TableSearch
            value={search}
            onChange={setSearch}
            placeholder="Search project, client, file..."
          />

          {/* STATUS FILTERS */}
          <div className="flex flex-wrap gap-2">
            {HISTORY_FILTERS.map((filter) => {
              const count =
                filter === "All"
                  ? counts.all
                  : filter === "Approved"
                    ? counts.approved
                    : filter === "Rejected"
                      ? counts.rejected
                      : counts.pending;

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

          {/* HISTORY TABLE */}
          <DataTable
            columns={columns}
            rows={filteredHistory}
            emptyMessage={
              search || historyFilter !== "All"
                ? "No BRD history matches your filters."
                : "No BRD history found."
            }
          />
        </div>
      )}
    </div>
  );
}

export default BRDUpload;
