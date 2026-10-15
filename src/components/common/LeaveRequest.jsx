import { useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock3,
  Users,
  Building2,
  CalendarDays,
  Download,
  History,
  MessageSquare,
  X,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Textarea from "../../components/common/TextArea";
import EmptyState from "../../components/common/EmptyState";
import { showToast } from "../../components/common/Toast";
import showAlert from "../../components/common/Alert";

// -----------------------------------------------------------------------------
// Dummy data matching: brds, brd_versions, brd_reviews
// -----------------------------------------------------------------------------

const INITIAL_BRDS = [
  {
    id: 1,
    uuid: "a1000000-0000-4000-8000-000000000001",
    projectId: 12,
    companyId: 1,
    clientId: 7,
    title: "Solar Installation Customer Portal",
    description:
      "Requirements for customer registration, installation tracking, document management, and project progress reporting.",
    status: "PENDING_ADMIN_APPROVAL",
    createdBy: 21,
    createdAt: "2026-10-07T09:30:00+05:30",
    updatedAt: "2026-10-08T10:15:00+05:30",

    // Display-only names to make the dummy UI readable.
    projectName: "Solar Installation CRM",
    companyName: "Alpha Technologies",
    clientName: "Green Energy Solutions",
    creatorName: "Rahul Sharma",

    versions: [
      {
        id: 31,
        uuid: "b1000000-0000-4000-8000-000000000031",
        brdId: 1,
        version: 1,
        fileName: "solar-customer-portal-v1.pdf",
        fileUrl: "https://example.com/files/solar-customer-portal-v1.pdf",
        storageKey: "brds/solar-customer-portal/v1.pdf",
        mimeType: "application/pdf",
        fileSize: 1843200,
        uploadedBy: 21,
        createdAt: "2026-10-07T09:30:00+05:30",
        uploaderName: "Rahul Sharma",
      },
      {
        id: 32,
        uuid: "b1000000-0000-4000-8000-000000000032",
        brdId: 1,
        version: 2,
        fileName: "solar-customer-portal-v2.pdf",
        fileUrl: "https://example.com/files/solar-customer-portal-v2.pdf",
        storageKey: "brds/solar-customer-portal/v2.pdf",
        mimeType: "application/pdf",
        fileSize: 2457600,
        uploadedBy: 21,
        createdAt: "2026-10-08T10:15:00+05:30",
        uploaderName: "Rahul Sharma",
      },
    ],

    reviews: [
      {
        id: 101,
        uuid: "c1000000-0000-4000-8000-000000000101",
        brdId: 1,
        brdVersionId: 31,
        reviewerId: 5,
        reviewerRole: "admin",
        action: "REJECTED",
        message: "Please include the document retention requirements.",
        reviewedAt: "2026-10-07T14:30:00+05:30",
        reviewerName: "Admin User",
      },
    ],
  },

  {
    id: 2,
    uuid: "a1000000-0000-4000-8000-000000000002",
    projectId: 18,
    companyId: 1,
    clientId: 9,
    title: "Inventory and Warehouse Management",
    description:
      "Business requirements for inventory tracking, stock adjustments, warehouse transfers, and stock reports.",
    status: "PENDING_ADMIN_APPROVAL",
    createdBy: 24,
    createdAt: "2026-10-08T11:00:00+05:30",
    updatedAt: "2026-10-08T11:00:00+05:30",
    projectName: "Inventory Management System",
    companyName: "Alpha Technologies",
    clientName: "Bright Future Industries",
    creatorName: "Priya Patel",

    versions: [
      {
        id: 41,
        uuid: "b1000000-0000-4000-8000-000000000041",
        brdId: 2,
        version: 1,
        fileName: "inventory-management-v1.docx",
        fileUrl: "https://example.com/files/inventory-management-v1.docx",
        storageKey: "brds/inventory-management/v1.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSize: 1024000,
        uploadedBy: 24,
        createdAt: "2026-10-08T11:00:00+05:30",
        uploaderName: "Priya Patel",
      },
    ],

    reviews: [],
  },

  {
    id: 3,
    uuid: "a1000000-0000-4000-8000-000000000003",
    projectId: 22,
    companyId: 2,
    clientId: 14,
    title: "Employee Attendance Automation",
    description:
      "Requirements for attendance records, shift management, attendance corrections, and monthly reports.",
    status: "APPROVED",
    createdBy: 30,
    createdAt: "2026-10-05T09:00:00+05:30",
    updatedAt: "2026-10-06T16:00:00+05:30",
    projectName: "HR Management Platform",
    companyName: "Beta Solutions",
    clientName: "Nova Services",
    creatorName: "Amit Verma",

    versions: [
      {
        id: 51,
        uuid: "b1000000-0000-4000-8000-000000000051",
        brdId: 3,
        version: 1,
        fileName: "attendance-automation-v1.pdf",
        fileUrl: "https://example.com/files/attendance-automation-v1.pdf",
        storageKey: "brds/attendance-automation/v1.pdf",
        mimeType: "application/pdf",
        fileSize: 1572864,
        uploadedBy: 30,
        createdAt: "2026-10-05T09:00:00+05:30",
        uploaderName: "Amit Verma",
      },
    ],

    reviews: [
      {
        id: 201,
        uuid: "c1000000-0000-4000-8000-000000000201",
        brdId: 3,
        brdVersionId: 51,
        reviewerId: 5,
        reviewerRole: "admin",
        action: "APPROVED",
        message: "Requirements reviewed and approved.",
        reviewedAt: "2026-10-06T12:00:00+05:30",
        reviewerName: "Admin User",
      },
      {
        id: 202,
        uuid: "c1000000-0000-4000-8000-000000000202",
        brdId: 3,
        brdVersionId: 51,
        reviewerId: 14,
        reviewerRole: "client",
        action: "APPROVED",
        message: "Approved by the client.",
        reviewedAt: "2026-10-06T16:00:00+05:30",
        reviewerName: "Client Representative",
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING_ADMIN_APPROVAL: "Pending Admin",
  ADMIN_REJECTED: "Admin Rejected",
  PENDING_CLIENT_APPROVAL: "Pending Client",
  CLIENT_REJECTED: "Client Rejected",
  APPROVED: "Approved",
};

const STATUS_TONES = {
  DRAFT: "neutral",
  PENDING_ADMIN_APPROVAL: "warning",
  ADMIN_REJECTED: "danger",
  PENDING_CLIENT_APPROVAL: "info",
  CLIENT_REJECTED: "danger",
  APPROVED: "success",
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFileSize = (bytes) => {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getStatusLabel = (status) => STATUS_LABELS[status] || status;

const getStatusTone = (status) => STATUS_TONES[status] || "neutral";

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function AdminBRDApproval() {
  const [brds, setBrds] = useState(INITIAL_BRDS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING_ADMIN_APPROVAL");
  const [selectedBRD, setSelectedBRD] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const filteredBRDs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return brds.filter((brd) => {
      const matchesStatus =
        statusFilter === "ALL" || brd.status === statusFilter;

      const matchesSearch =
        !query ||
        [
          brd.title,
          brd.uuid,
          brd.projectName,
          brd.clientName,
          brd.companyName,
          brd.creatorName,
          String(brd.id),
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );

      return matchesStatus && matchesSearch;
    });
  }, [brds, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: brds.length,
      pending: brds.filter((brd) => brd.status === "PENDING_ADMIN_APPROVAL")
        .length,
      approved: brds.filter((brd) => brd.status === "APPROVED").length,
      rejected: brds.filter((brd) => brd.status === "ADMIN_REJECTED").length,
    }),
    [brds],
  );

  const openDetails = (brd) => {
    setSelectedBRD(brd);
    setShowRejectForm(false);
    setRejectionReason("");
  };

  const closeDetails = () => {
    setSelectedBRD(null);
    setShowRejectForm(false);
    setRejectionReason("");
  };

  // Dummy action: updates React state only; no database request is made.
  const handleApprove = async (brd) => {
    const result = await showAlert.confirm({
      title: "Approve BRD?",
      text: `Approve "${brd.title}" and send it for client approval?`,
      confirmButtonText: "Approve BRD",
      cancelButtonText: "Cancel",
    });

    if (!result?.isConfirmed) return;

    const latestVersion = [...brd.versions].sort(
      (a, b) => b.version - a.version,
    )[0];

    if (!latestVersion) {
      showToast.error("No BRD version was found to review.");
      return;
    }

    const now = new Date().toISOString();

    const review = {
      id: Date.now(),
      uuid: `c${Date.now()}-0000-4000-8000-000000000001`,
      brdId: brd.id,
      brdVersionId: latestVersion.id,
      reviewerId: 5,
      reviewerRole: "admin",
      action: "APPROVED",
      message: "Approved by admin.",
      reviewedAt: now,
      reviewerName: "Admin User",
    };

    setBrds((current) =>
      current.map((item) =>
        item.id === brd.id
          ? {
              ...item,
              status: "PENDING_CLIENT_APPROVAL",
              updatedAt: now,
              reviews: [review, ...item.reviews],
            }
          : item,
      ),
    );

    setSelectedBRD((current) =>
      current?.id === brd.id
        ? {
            ...current,
            status: "PENDING_CLIENT_APPROVAL",
            updatedAt: now,
            reviews: [review, ...current.reviews],
          }
        : current,
    );

    showToast.success("BRD approved and moved to client approval.");
  };

  const handleReject = async (brd) => {
    const message = rejectionReason.trim();

    if (!message) {
      showToast.error("Please enter a rejection reason.");
      return;
    }

    const latestVersion = [...brd.versions].sort(
      (a, b) => b.version - a.version,
    )[0];

    if (!latestVersion) {
      showToast.error("No BRD version was found to review.");
      return;
    }

    const result = await showAlert.confirm({
      title: "Reject BRD?",
      text: "The rejection reason will be recorded in the review history.",
      confirmButtonText: "Reject BRD",
      cancelButtonText: "Cancel",
    });

    if (!result?.isConfirmed) return;

    const now = new Date().toISOString();

    const review = {
      id: Date.now(),
      uuid: `c${Date.now()}-0000-4000-8000-000000000002`,
      brdId: brd.id,
      brdVersionId: latestVersion.id,
      reviewerId: 5,
      reviewerRole: "admin",
      action: "REJECTED",
      message,
      reviewedAt: now,
      reviewerName: "Admin User",
    };

    setBrds((current) =>
      current.map((item) =>
        item.id === brd.id
          ? {
              ...item,
              status: "ADMIN_REJECTED",
              updatedAt: now,
              reviews: [review, ...item.reviews],
            }
          : item,
      ),
    );

    setSelectedBRD((current) =>
      current?.id === brd.id
        ? {
            ...current,
            status: "ADMIN_REJECTED",
            updatedAt: now,
            reviews: [review, ...current.reviews],
          }
        : current,
    );

    setShowRejectForm(false);
    setRejectionReason("");
    showToast.success("BRD rejected and review recorded.");
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("PENDING_ADMIN_APPROVAL");
  };

  return (
    <div className="min-h-screen space-y-6 bg-cm-bg p-4 text-cm-text sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-cm-text-muted">
            <FileText size={16} />
            Administration / BRD Approval
          </div>

          <h1 className="text-2xl font-bold tracking-tight">BRD Approval</h1>

          <p className="mt-1 text-sm text-cm-text-muted">
            Review uploaded Business Requirements Documents and manage the admin
            approval stage.
          </p>
        </div>

        <Button
          variant="outline"
          leftIcon={<RefreshCw size={16} />}
          onClick={() => {
            setBrds(
              INITIAL_BRDS.map((brd) => ({
                ...brd,
                versions: brd.versions.map((version) => ({ ...version })),
                reviews: brd.reviews.map((review) => ({ ...review })),
              })),
            );
            resetFilters();
            closeDetails();
            showToast.success("Dummy data has been reset.");
          }}
        >
          Reset Demo
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total BRDs"
          value={stats.total}
          icon={<FileText size={20} />}
          description="All demo records"
        />
        <SummaryCard
          label="Pending Admin"
          value={stats.pending}
          icon={<Clock3 size={20} />}
          description="Awaiting admin review"
        />
        <SummaryCard
          label="Approved"
          value={stats.approved}
          icon={<CheckCircle2 size={20} />}
          description="Client approval or completed"
        />
        <SummaryCard
          label="Admin Rejected"
          value={stats.rejected}
          icon={<XCircle size={20} />}
          description="Requires revision"
        />
      </div>

      {/* Filters */}
      <section className="rounded-xl border border-cm-border bg-cm-card p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_240px_auto] md:items-end">
          <Input
            label="Search BRDs"
            placeholder="Search title, project, client, UUID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <Select
            label="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "PENDING_ADMIN_APPROVAL", label: "Pending Admin" },
              { value: "ALL", label: "All statuses" },
              { value: "DRAFT", label: "Draft" },
              { value: "ADMIN_REJECTED", label: "Admin Rejected" },
              {
                value: "PENDING_CLIENT_APPROVAL",
                label: "Pending Client",
              },
              { value: "CLIENT_REJECTED", label: "Client Rejected" },
              { value: "APPROVED", label: "Approved" },
            ]}
          />

          <Button variant="outline" onClick={resetFilters}>
            Clear filters
          </Button>
        </div>
      </section>

      {/* BRD list */}
      <section className="overflow-hidden rounded-xl border border-cm-border bg-cm-card">
        <div className="flex flex-col gap-2 border-b border-cm-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Business Requirements Documents</h2>
            <p className="mt-1 text-sm text-cm-text-muted">
              {filteredBRDs.length} record
              {filteredBRDs.length === 1 ? "" : "s"} found
            </p>
          </div>

          <Badge tone="info">Demo data</Badge>
        </div>

        {filteredBRDs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No BRDs found"
              description="Try changing the search term or status filter."
              action={
                <Button variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-cm-bg text-xs uppercase tracking-wide text-cm-text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">BRD</th>
                  <th className="px-5 py-3 font-semibold">Project / Client</th>
                  <th className="px-5 py-3 font-semibold">Latest version</th>
                  <th className="px-5 py-3 font-semibold">Submitted</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-cm-border">
                {filteredBRDs.map((brd) => {
                  const latestVersion = [...brd.versions].sort(
                    (a, b) => b.version - a.version,
                  )[0];

                  return (
                    <tr key={brd.uuid} className="align-top hover:bg-cm-bg/60">
                      <td className="px-5 py-4">
                        <p className="font-semibold">{brd.title}</p>
                        <p className="mt-1 text-xs text-cm-text-muted">
                          BRD ID: {brd.id}
                        </p>
                        <p className="mt-1 max-w-[270px] truncate text-xs text-cm-text-muted">
                          {brd.uuid}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium">{brd.projectName}</p>
                        <p className="mt-1 text-xs text-cm-text-muted">
                          {brd.clientName}
                        </p>
                        <p className="mt-1 text-xs text-cm-text-muted">
                          Project ID: {brd.projectId} · Client ID:{" "}
                          {brd.clientId}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {latestVersion ? (
                          <>
                            <p className="font-medium">
                              v{latestVersion.version}
                            </p>
                            <p className="mt-1 max-w-[210px] truncate text-xs text-cm-text-muted">
                              {latestVersion.fileName}
                            </p>
                          </>
                        ) : (
                          <span className="text-cm-text-muted">No version</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p>{formatDate(brd.createdAt)}</p>
                        <p className="mt-1 text-xs text-cm-text-muted">
                          By {brd.creatorName}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <Badge tone={getStatusTone(brd.status)}>
                          {getStatusLabel(brd.status)}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<Eye size={15} />}
                            onClick={() => openDetails(brd)}
                          >
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Details panel */}
      {selectedBRD && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:p-6">
          <section className="my-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-cm-border bg-cm-card shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-cm-border p-5 sm:p-6">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone={getStatusTone(selectedBRD.status)}>
                    {getStatusLabel(selectedBRD.status)}
                  </Badge>
                  <span className="text-xs text-cm-text-muted">
                    BRD ID: {selectedBRD.id}
                  </span>
                </div>

                <h2 className="text-xl font-bold">{selectedBRD.title}</h2>
                <p className="mt-1 break-all text-xs text-cm-text-muted">
                  UUID: {selectedBRD.uuid}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                aria-label="Close details"
                className="rounded-lg p-2 text-cm-text-muted transition hover:bg-cm-bg hover:text-cm-text"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              {/* BRD table fields */}
              <div>
                <h3 className="mb-3 font-semibold">BRD details</h3>

                <p className="mb-4 whitespace-pre-wrap text-sm leading-6 text-cm-text-muted">
                  {selectedBRD.description || "No description provided."}
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem
                    icon={<FileText size={17} />}
                    label="Project"
                    value={`${selectedBRD.projectName} (ID: ${selectedBRD.projectId})`}
                  />
                  <DetailItem
                    icon={<Building2 size={17} />}
                    label="Company"
                    value={`${selectedBRD.companyName} (ID: ${selectedBRD.companyId})`}
                  />
                  <DetailItem
                    icon={<Users size={17} />}
                    label="Client"
                    value={`${selectedBRD.clientName} (ID: ${selectedBRD.clientId})`}
                  />
                  <DetailItem
                    icon={<Users size={17} />}
                    label="Created by"
                    value={`${selectedBRD.creatorName} (ID: ${selectedBRD.createdBy})`}
                  />
                  <DetailItem
                    icon={<CalendarDays size={17} />}
                    label="Created at"
                    value={formatDateTime(selectedBRD.createdAt)}
                  />
                  <DetailItem
                    icon={<RefreshCw size={17} />}
                    label="Last updated"
                    value={formatDateTime(selectedBRD.updatedAt)}
                  />
                </div>
              </div>

              {/* BRD versions table */}
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Uploaded versions</h3>
                  <Badge>{selectedBRD.versions.length} version(s)</Badge>
                </div>

                {selectedBRD.versions.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-cm-border p-4 text-sm text-cm-text-muted">
                    No versions uploaded.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-cm-border">
                    <table className="w-full min-w-[650px] text-left text-sm">
                      <thead className="bg-cm-bg text-xs text-cm-text-muted">
                        <tr>
                          <th className="px-4 py-3">Version</th>
                          <th className="px-4 py-3">File</th>
                          <th className="px-4 py-3">Size</th>
                          <th className="px-4 py-3">Uploaded by</th>
                          <th className="px-4 py-3">Uploaded at</th>
                          <th className="px-4 py-3">File</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-cm-border">
                        {[...selectedBRD.versions]
                          .sort((a, b) => b.version - a.version)
                          .map((version) => (
                            <tr key={version.uuid}>
                              <td className="px-4 py-3 font-semibold">
                                v{version.version}
                              </td>
                              <td className="px-4 py-3">
                                <p className="max-w-[220px] truncate font-medium">
                                  {version.fileName}
                                </p>
                                <p className="mt-1 text-xs text-cm-text-muted">
                                  Version ID: {version.id}
                                </p>
                                <p className="mt-1 text-xs text-cm-text-muted">
                                  {version.mimeType || "Unknown file type"}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                {formatFileSize(version.fileSize)}
                              </td>
                              <td className="px-4 py-3">
                                {version.uploaderName}
                                <p className="mt-1 text-xs text-cm-text-muted">
                                  User ID: {version.uploadedBy}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                {formatDateTime(version.createdAt)}
                              </td>
                              <td className="px-4 py-3">
                                <a
                                  href={version.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
                                >
                                  <Download size={14} />
                                  Open
                                </a>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* BRD reviews table */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <History size={18} />
                  <h3 className="font-semibold">Review history</h3>
                  <Badge>{selectedBRD.reviews.length}</Badge>
                </div>

                {selectedBRD.reviews.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-cm-border p-4 text-sm text-cm-text-muted">
                    No reviews recorded for this BRD.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {[...selectedBRD.reviews]
                      .sort(
                        (a, b) =>
                          new Date(b.reviewedAt) - new Date(a.reviewedAt),
                      )
                      .map((review) => (
                        <div
                          key={review.uuid}
                          className="rounded-lg border border-cm-border p-4"
                        >
                          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  tone={
                                    review.action === "APPROVED"
                                      ? "success"
                                      : "danger"
                                  }
                                >
                                  {review.action}
                                </Badge>

                                <Badge tone="neutral">
                                  {review.reviewerRole}
                                </Badge>

                                <span className="text-xs text-cm-text-muted">
                                  Review ID: {review.id}
                                </span>
                              </div>

                              <p className="mt-2 text-sm font-medium">
                                {review.reviewerName}
                              </p>
                              <p className="mt-1 text-xs text-cm-text-muted">
                                Reviewer ID: {review.reviewerId} · Version ID:{" "}
                                {review.brdVersionId}
                              </p>
                            </div>

                            <span className="text-xs text-cm-text-muted">
                              {formatDateTime(review.reviewedAt)}
                            </span>
                          </div>

                          {review.message && (
                            <p className="mt-3 flex items-start gap-2 text-sm text-cm-text-muted">
                              <MessageSquare
                                size={15}
                                className="mt-0.5 shrink-0"
                              />
                              {review.message}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Admin actions */}
              {selectedBRD.status === "PENDING_ADMIN_APPROVAL" && (
                <div className="rounded-xl border border-cm-border bg-cm-bg p-4 sm:p-5">
                  <h3 className="font-semibold">Admin decision</h3>
                  <p className="mt-1 text-sm text-cm-text-muted">
                    Approve the latest version to send it to the client, or
                    reject it with a reason.
                  </p>

                  {showRejectForm ? (
                    <div className="mt-4 space-y-3">
                      <Textarea
                        name="rejectionReason"
                        label="Rejection reason"
                        value={rejectionReason}
                        onChange={(event) =>
                          setRejectionReason(event.target.value)
                        }
                        placeholder="Explain what needs to be corrected..."
                        rows={4}
                        required
                      />

                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectionReason("");
                          }}
                        >
                          Cancel
                        </Button>

                        <Button
                          variant="danger"
                          leftIcon={<XCircle size={16} />}
                          onClick={() => handleReject(selectedBRD)}
                        >
                          Confirm rejection
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap justify-end gap-3">
                      <Button
                        variant="danger"
                        leftIcon={<XCircle size={16} />}
                        onClick={() => setShowRejectForm(true)}
                      >
                        Reject
                      </Button>

                      <Button
                        variant="primary"
                        leftIcon={<CheckCircle2 size={16} />}
                        onClick={() => handleApprove(selectedBRD)}
                      >
                        Approve BRD
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {selectedBRD.status !== "PENDING_ADMIN_APPROVAL" && (
                <div className="rounded-lg border border-cm-border p-4 text-sm text-cm-text-muted">
                  This BRD is currently{" "}
                  <strong>{getStatusLabel(selectedBRD.status)}</strong>. Admin
                  approval actions are available only when its status is
                  <code className="mx-1 rounded bg-cm-bg px-1.5 py-0.5">
                    PENDING_ADMIN_APPROVAL
                  </code>
                  .
                </div>
              )}

              <div className="flex justify-end border-t border-cm-border pt-4">
                <Button variant="outline" onClick={closeDetails}>
                  Close details
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Small local display components
// -----------------------------------------------------------------------------

function SummaryCard({ label, value, icon, description }) {
  return (
    <div className="rounded-xl border border-cm-border bg-cm-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-cm-text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
        </div>

        <div className="rounded-lg border border-cm-border bg-cm-bg p-3">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-cm-text-muted">{description}</p>
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-cm-border p-3">
      <div className="mb-2 flex items-center gap-2 text-cm-text-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="break-words text-sm font-medium">{value || "—"}</p>
    </div>
  );
}
