import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock3,
  Building2,
  UserRound,
  CalendarDays,
  MessageSquareText,
  X,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { showToast } from "../../components/common/Toast";
import showAlert from "../../components/common/Alert";

const API_URL = "/api/brds";

const STATUS = {
  DRAFT: "DRAFT",
  PENDING: "PENDING_ADMIN_APPROVAL",
  REJECTED: "ADMIN_REJECTED",
  CLIENT_PENDING: "PENDING_CLIENT_APPROVAL",
  CLIENT_REJECTED: "CLIENT_REJECTED",
  APPROVED: "APPROVED",
};

const STATUS_LABEL = {
  [STATUS.DRAFT]: "Draft",
  [STATUS.PENDING]: "Pending Admin Review",
  [STATUS.REJECTED]: "Admin Rejected",
  [STATUS.CLIENT_PENDING]: "Pending Client Approval",
  [STATUS.CLIENT_REJECTED]: "Client Rejected",
  [STATUS.APPROVED]: "Approved",
};

const STATUS_TONE = {
  [STATUS.DRAFT]: "neutral",
  [STATUS.PENDING]: "warning",
  [STATUS.REJECTED]: "danger",
  [STATUS.CLIENT_PENDING]: "info",
  [STATUS.CLIENT_REJECTED]: "danger",
  [STATUS.APPROVED]: "success",
};

const FILTERS = [
  { value: "PENDING", label: "Pending Review", status: STATUS.PENDING },
  { value: "ALL", label: "All BRDs" },
  { value: "REJECTED", label: "Admin Rejected", status: STATUS.REJECTED },
  {
    value: "CLIENT_PENDING",
    label: "Awaiting Client",
    status: STATUS.CLIENT_PENDING,
  },
  { value: "APPROVED", label: "Approved", status: STATUS.APPROVED },
];

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

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const getPersonName = (person) => {
  if (!person) return "";

  if (typeof person === "string") return person;

  const fullName = [person.firstName, person.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || person.name || person.username || "";
};

const getLatestVersion = (brd) => {
  if (brd.latestVersion) return brd.latestVersion;
  if (brd.version && typeof brd.version === "object") return brd.version;

  const versions = Array.isArray(brd.versions) ? brd.versions : [];

  return (
    [...versions].sort(
      (a, b) =>
        Number(b.version ?? b.versionNumber ?? 0) -
        Number(a.version ?? a.versionNumber ?? 0),
    )[0] || null
  );
};

const normalizeBRD = (brd) => {
  const version = getLatestVersion(brd);

  const client =
    typeof brd.client === "string"
      ? brd.client
      : getPersonName(brd.client) ||
        getPersonName(brd.project?.client?.user) ||
        getPersonName(brd.project?.client);

  const creator =
    getPersonName(brd.creator) ||
    getPersonName(brd.user) ||
    getPersonName(version?.uploader);

  const projectName = brd.project?.name || brd.title || "Untitled Project";

  return {
    ...brd,
    version,
    projectName,
    clientName: client || "—",
    uploader: creator || "—",
    fileName:
      version?.fileName ||
      version?.originalName ||
      brd.fileName ||
      "BRD document",
    uploadedAt: version?.createdAt || version?.uploadedAt || brd.createdAt,
    currentStatus: brd.status,
  };
};

function SummaryCard({ title, value, icon: Icon, description }) {
  return (
    <div className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-cm-text-muted">{title}</p>
          <p className="mt-2 text-2xl font-bold text-cm-text">{value}</p>
        </div>

        <div className="rounded-lg bg-cm-bg p-2.5 text-cm-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-3 text-xs text-cm-text-muted">{description}</p>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="rounded-lg bg-cm-bg p-2 text-cm-primary">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-cm-text-muted">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-cm-text">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ title, description, onRetry }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="rounded-full bg-cm-bg p-4">
        <FileText className="h-8 w-8 text-cm-text-muted" />
      </div>

      <h3 className="mt-4 font-semibold text-cm-text">{title}</h3>

      <p className="mt-1 max-w-md text-sm text-cm-text-muted">{description}</p>

      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}

function AdminBRDApproval() {
  const [brds, setBrds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("PENDING");

  const [selectedBRD, setSelectedBRD] = useState(null);
  const [reviewAction, setReviewAction] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchBRDs = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setLoadError("");

    try {
      // This is the admin endpoint, not the BDE history endpoint.
      const response = await axios.get(`${API_URL}/admin`, {
        withCredentials: true,
      });

      const records = response.data?.data;

      if (!Array.isArray(records)) {
        throw new Error("The BRD API did not return a list of records.");
      }

      setBrds(records.map(normalizeBRD));
    } catch (error) {
      console.error("Failed to fetch admin BRDs:", error);

      const message = getErrorMessage(error, "Failed to load BRD records.");

      setLoadError(message);
      showToast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBRDs();
  }, [fetchBRDs]);

  const counts = useMemo(
    () => ({
      all: brds.length,
      pending: brds.filter((brd) => brd.status === STATUS.PENDING).length,
      rejected: brds.filter((brd) => brd.status === STATUS.REJECTED).length,
      clientPending: brds.filter((brd) => brd.status === STATUS.CLIENT_PENDING)
        .length,
      approved: brds.filter((brd) => brd.status === STATUS.APPROVED).length,
    }),
    [brds],
  );

  const filteredBRDs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return brds.filter((brd) => {
      const filter = FILTERS.find((item) => item.value === activeFilter);

      const matchesFilter =
        activeFilter === "ALL" || (filter && brd.status === filter.status);

      const searchableText = [
        brd.projectName,
        brd.clientName,
        brd.fileName,
        brd.uploader,
        brd.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!query || searchableText.includes(query));
    });
  }, [brds, activeFilter, search]);

  const openDetails = async (brd) => {
    setSelectedBRD(brd);
    setReviewAction(null);
    setRemarks("");

    // Fetch full details so the modal can show version/review history.
    try {
      const id = brd.id;

      if (!id) return;

      const response = await axios.get(`${API_URL}/admin/${id}`, {
        withCredentials: true,
      });

      if (response.data?.data) {
        setSelectedBRD(normalizeBRD(response.data.data));
      }
    } catch (error) {
      console.error("Failed to fetch BRD details:", error);
      showToast.error(
        getErrorMessage(error, "Could not load complete BRD details."),
      );
    }
  };

  const closeModals = () => {
    if (submitting) return;

    setSelectedBRD(null);
    setReviewAction(null);
    setRemarks("");
  };

  const startReview = (brd, action) => {
    setSelectedBRD(brd);
    setReviewAction(action);
    setRemarks("");
  };

  const submitReview = async () => {
    if (!selectedBRD || !reviewAction || submitting) return;

    const isReject = reviewAction === "REJECTED";

    if (isReject && !remarks.trim()) {
      showToast.error("Please provide a reason for rejecting the BRD.");
      return;
    }

    const confirmed = await showAlert.confirm({
      title: isReject ? "Reject this BRD?" : "Approve this BRD?",
      text: isReject
        ? "The BRD will be returned for corrections."
        : "The BRD will be forwarded for client approval.",
      confirmButtonText: isReject ? "Yes, reject" : "Yes, approve",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) return;

    setSubmitting(true);

    try {
      // Match the backend controller and service payload.
      const brdId = selectedBRD.id;

      if (!brdId) {
        throw new Error("The BRD record does not contain a valid ID.");
      }

      const response = await axios.patch(
        `${API_URL}/admin/${brdId}/decision`,
        {
          action: reviewAction,
          message: remarks.trim() || null,
        },
        {
          withCredentials: true,
        },
      );

      showToast.success(
        response.data?.message ||
          (isReject
            ? "BRD rejected successfully."
            : "BRD approved and forwarded for client approval."),
      );

      setSelectedBRD(null);
      setReviewAction(null);
      setRemarks("");

      await fetchBRDs(true);
    } catch (error) {
      console.error("BRD review failed:", error);

      showToast.error(
        getErrorMessage(error, "Failed to submit the BRD decision."),
      );
    } finally {
      setSubmitting(false);
    }
  };
  const openDocument = (brd) => {
    const version = brd.version;

    if (!version?.uuid) {
      showToast.error("BRD version UUID not found.");
      return;
    }

    const documentUrl = `${API_URL}/versions/${version.uuid}/file`;

    window.open(documentUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-cm-primary" />
            <h1 className="text-xl font-bold text-cm-text">BRD Approval</h1>
          </div>

          <p className="mt-1 max-w-2xl text-sm text-cm-text-muted">
            Review uploaded Business Requirements Documents, verify project
            details, and approve or reject submissions.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => fetchBRDs(true)}
          disabled={refreshing || loading}
          loading={refreshing}
        >
          {!refreshing && <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Pending Review"
          value={counts.pending}
          icon={Clock3}
          description="Requires admin action"
        />

        <SummaryCard
          title="Admin Rejected"
          value={counts.rejected}
          icon={XCircle}
          description="Returned for corrections"
        />

        <SummaryCard
          title="Awaiting Client"
          value={counts.clientPending}
          icon={UserRound}
          description="Admin approved"
        />

        <SummaryCard
          title="Fully Approved"
          value={counts.approved}
          icon={CheckCircle2}
          description="Approval workflow completed"
        />
      </div>

      {/* BRD table */}
      <section className="overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card shadow-sm">
        <div className="border-b border-cm-border p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-cm-text">Uploaded BRDs</h2>

              <p className="mt-1 text-sm text-cm-text-muted">
                {filteredBRDs.length} document
                {filteredBRDs.length !== 1 ? "s" : ""} found
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cm-text-muted" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search project, client, file..."
                aria-label="Search BRDs"
                className="w-full rounded-cm-md border border-cm-border bg-cm-card py-2.5 pl-9 pr-3 text-sm text-cm-text outline-none focus:border-cm-primary"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveFilter(value)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  activeFilter === value
                    ? "border-cm-primary bg-cm-primary/10 font-medium text-cm-primary"
                    : "border-cm-border text-cm-text-muted hover:bg-cm-bg"
                }`}
              >
                {label}

                {value === "PENDING" && (
                  <span className="ml-2">{counts.pending}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader context="section" label="Loading BRD records..." />
          </div>
        ) : loadError && brds.length === 0 ? (
          <EmptyState
            title="Unable to load BRDs"
            description={loadError}
            onRetry={() => fetchBRDs()}
          />
        ) : filteredBRDs.length === 0 ? (
          <EmptyState
            title="No BRDs found"
            description={
              search
                ? "Try a different search term or status filter."
                : activeFilter === "PENDING"
                  ? "There are no BRDs waiting for admin review."
                  : "There are no BRDs matching this status."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-cm-bg text-xs uppercase tracking-wide text-cm-text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Project / Client</th>
                  <th className="px-5 py-3 font-medium">Document</th>
                  <th className="px-5 py-3 font-medium">Uploaded By</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-cm-border">
                {filteredBRDs.map((brd) => {
                  const canReview = brd.status === STATUS.PENDING;

                  return (
                    <tr
                      key={brd.uuid || brd.id}
                      className="transition hover:bg-cm-bg/60"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-cm-text">
                          {brd.projectName}
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-xs text-cm-text-muted">
                          <Building2 className="h-3.5 w-3.5" />
                          {brd.clientName}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-cm-bg p-2">
                            <FileText className="h-5 w-5 text-cm-primary" />
                          </div>

                          <div>
                            <p className="max-w-52 truncate text-sm font-medium text-cm-text">
                              {brd.fileName}
                            </p>

                            <p className="mt-1 text-xs text-cm-text-muted">
                              Version{" "}
                              {brd.version?.version ??
                                brd.version?.versionNumber ??
                                "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-cm-text">{brd.uploader}</p>

                        <p className="mt-1 text-xs text-cm-text-muted">
                          {formatDate(brd.uploadedAt)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <Badge tone={STATUS_TONE[brd.status] || "neutral"}>
                          {STATUS_LABEL[brd.status] || brd.status || "Unknown"}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetails(brd)}
                          >
                            <Eye className="mr-1.5 h-4 w-4" />
                            Review
                          </Button>

                          {canReview && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => startReview(brd, "APPROVED")}
                              >
                                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                Approve
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startReview(brd, "REJECTED")}
                              >
                                <XCircle className="mr-1.5 h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          )}
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

      {/* BRD details modal */}
      {selectedBRD && !reviewAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="brd-detail-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-cm-lg border border-cm-border bg-cm-card shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-cm-border p-5">
              <div>
                <p className="text-xs font-medium text-cm-text-muted">
                  BRD REVIEW
                </p>

                <h2
                  id="brd-detail-title"
                  className="mt-1 text-lg font-semibold text-cm-text"
                >
                  {selectedBRD.projectName}
                </h2>

                <p className="mt-1 text-sm text-cm-text-muted">
                  {selectedBRD.clientName}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModals}
                className="rounded-lg p-2 text-cm-text-muted hover:bg-cm-bg"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone={STATUS_TONE[selectedBRD.status] || "neutral"}>
                  {STATUS_LABEL[selectedBRD.status] || selectedBRD.status}
                </Badge>

                <span className="text-sm text-cm-text-muted">
                  Uploaded {formatDate(selectedBRD.uploadedAt)}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={FileText}
                  label="Document"
                  value={selectedBRD.fileName}
                />

                <DetailItem
                  icon={UserRound}
                  label="Uploaded by"
                  value={selectedBRD.uploader}
                />

                <DetailItem
                  icon={Building2}
                  label="Client"
                  value={selectedBRD.clientName}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Version"
                  value={
                    selectedBRD.version?.version ??
                    selectedBRD.version?.versionNumber ??
                    "—"
                  }
                />
              </div>

              <div className="rounded-lg border border-cm-border p-4">
                <p className="text-sm font-medium text-cm-text">BRD document</p>

                <p className="mt-1 text-sm text-cm-text-muted">
                  Open the uploaded file to verify its requirements before
                  making a decision.
                </p>

                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => openDocument(selectedBRD)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open document
                </Button>
              </div>

              {Array.isArray(selectedBRD.versions) &&
                selectedBRD.versions.length > 0 && (
                  <div className="rounded-lg border border-cm-border p-4">
                    <h3 className="font-medium text-cm-text">
                      Version history
                    </h3>

                    <div className="mt-3 space-y-3">
                      {[...selectedBRD.versions]
                        .sort(
                          (a, b) =>
                            Number(b.version ?? 0) - Number(a.version ?? 0),
                        )
                        .map((version) => (
                          <div
                            key={version.uuid || version.id}
                            className="flex flex-wrap items-center justify-between gap-3 border-b border-cm-border pb-3 last:border-0 last:pb-0"
                          >
                            <div className="min-w-0">
                              <p className="break-words text-sm font-medium text-cm-text">
                                {version.fileName || "BRD document"}
                              </p>

                              <p className="mt-1 text-xs text-cm-text-muted">
                                Version {version.version ?? "—"} ·{" "}
                                {formatDate(version.createdAt)}
                              </p>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openDocument({
                                  ...selectedBRD,
                                  version,
                                })
                              }
                            >
                              <ExternalLink className="mr-1.5 h-4 w-4" />
                              Open
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {selectedBRD.status === STATUS.PENDING && (
                <div className="flex flex-wrap justify-end gap-3 border-t border-cm-border pt-4">
                  <Button
                    variant="outline"
                    onClick={() => startReview(selectedBRD, "REJECTED")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject BRD
                  </Button>

                  <Button onClick={() => startReview(selectedBRD, "APPROVED")}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve BRD
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Approve / reject remarks modal */}
      {selectedBRD && reviewAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="brd-decision-title"
            className="w-full max-w-lg rounded-cm-lg border border-cm-border bg-cm-card shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-cm-border p-5">
              <div>
                <h2
                  id="brd-decision-title"
                  className="text-lg font-semibold text-cm-text"
                >
                  {reviewAction === "APPROVED" ? "Approve BRD?" : "Reject BRD?"}
                </h2>

                <p className="mt-1 text-sm text-cm-text-muted">
                  {selectedBRD.projectName}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModals}
                disabled={submitting}
                className="rounded-lg p-2 text-cm-text-muted hover:bg-cm-bg disabled:opacity-50"
                aria-label="Close decision dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <p className="text-sm text-cm-text-muted">
                {reviewAction === "APPROVED"
                  ? "The BRD will move to client approval. It will not be marked as fully approved."
                  : "The BRD will be returned for corrections. Provide a clear rejection reason."}
              </p>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-cm-text">
                  <MessageSquareText className="h-4 w-4" />
                  Review remarks
                  {reviewAction === "REJECTED" && (
                    <span className="text-red-500">*</span>
                  )}
                </span>

                <textarea
                  rows={4}
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder={
                    reviewAction === "APPROVED"
                      ? "Optional approval notes..."
                      : "Explain what needs to be corrected..."
                  }
                  disabled={submitting}
                  className="w-full resize-y rounded-cm-md border border-cm-border bg-cm-card p-3 text-sm text-cm-text outline-none focus:border-cm-primary disabled:opacity-60"
                />
              </label>

              <div className="flex justify-end gap-3 border-t border-cm-border pt-4">
                <Button
                  variant="outline"
                  onClick={closeModals}
                  disabled={submitting}
                >
                  Cancel
                </Button>

                <Button
                  variant={reviewAction === "REJECTED" ? "danger" : "primary"}
                  onClick={submitReview}
                  loading={submitting}
                  disabled={
                    submitting ||
                    (reviewAction === "REJECTED" && !remarks.trim())
                  }
                >
                  {!submitting &&
                    (reviewAction === "APPROVED" ? (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    ))}

                  {submitting
                    ? "Submitting..."
                    : reviewAction === "APPROVED"
                      ? "Confirm Approval"
                      : "Confirm Rejection"}
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminBRDApproval;
