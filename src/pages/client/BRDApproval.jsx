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
  CalendarDays,
  MessageSquareText,
  ExternalLink,
  X,
  Building2,
  UserRound,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Textarea from "../../components/common/TextArea";
import Loader from "../../components/common/Loader";
import { showToast } from "../../components/common/Toast";
import showAlert from "../../components/common/Alert";

const API_URL = "/api/brds";

const STATUS = {
  DRAFT: "DRAFT",
  PENDING_ADMIN: "PENDING_ADMIN_APPROVAL",
  ADMIN_REJECTED: "ADMIN_REJECTED",
  PENDING_CLIENT: "PENDING_CLIENT_APPROVAL",
  CLIENT_REJECTED: "CLIENT_REJECTED",
  APPROVED: "APPROVED",
};

const STATUS_LABEL = {
  [STATUS.DRAFT]: "Draft",
  [STATUS.PENDING_ADMIN]: "Pending Admin Review",
  [STATUS.ADMIN_REJECTED]: "Admin Rejected",
  [STATUS.PENDING_CLIENT]: "Pending Your Review",
  [STATUS.CLIENT_REJECTED]: "Changes Requested",
  [STATUS.APPROVED]: "Approved",
};

const STATUS_TONE = {
  [STATUS.DRAFT]: "neutral",
  [STATUS.PENDING_ADMIN]: "warning",
  [STATUS.ADMIN_REJECTED]: "danger",
  [STATUS.PENDING_CLIENT]: "warning",
  [STATUS.CLIENT_REJECTED]: "danger",
  [STATUS.APPROVED]: "success",
};

const FILTERS = [
  { value: "PENDING", label: "Awaiting My Review" },
  { value: "ALL", label: "All BRDs" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Changes Requested" },
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

  return (
    person.name || [person.firstName, person.lastName].filter(Boolean).join(" ")
  );
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

  return {
    ...brd,
    version,
    projectName: brd.project?.name || brd.title || "Untitled Project",
    clientName:
      getPersonName(brd.client?.user) || getPersonName(brd.client) || "—",
    creatorName: getPersonName(brd.creator) || getPersonName(brd.user) || "—",
    fileName: version?.fileName || "BRD document",
    uploadedAt: version?.createdAt || brd.createdAt,
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

export default function BRDApproval() {
  const [brds, setBrds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("PENDING");

  const [selectedBRD, setSelectedBRD] = useState(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchBRDs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setLoadError("");

    try {
      const response = await axios.get(`${API_URL}/client`, {
        withCredentials: true,
      });

      const records = response.data?.data;

      if (!Array.isArray(records)) {
        throw new Error("The server did not return a BRD list.");
      }

      setBrds(records.map(normalizeBRD));
    } catch (error) {
      console.error("Failed to fetch client BRDs:", error);

      const message = getErrorMessage(error, "Failed to load your BRDs.");

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
      pending: brds.filter((brd) => brd.status === STATUS.PENDING_CLIENT)
        .length,
      approved: brds.filter((brd) => brd.status === STATUS.APPROVED).length,
      rejected: brds.filter((brd) => brd.status === STATUS.CLIENT_REJECTED)
        .length,
    }),
    [brds],
  );

  const filteredBRDs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return brds.filter((brd) => {
      const matchesFilter =
        activeFilter === "ALL" ||
        (activeFilter === "PENDING" && brd.status === STATUS.PENDING_CLIENT) ||
        (activeFilter === "APPROVED" && brd.status === STATUS.APPROVED) ||
        (activeFilter === "REJECTED" && brd.status === STATUS.CLIENT_REJECTED);

      const searchable = [
        brd.projectName,
        brd.title,
        brd.fileName,
        brd.creatorName,
        brd.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!query || searchable.includes(query));
    });
  }, [brds, activeFilter, search]);

  const openDetails = async (brd) => {
    setSelectedBRD(brd);
    setComment("");

    try {
      const response = await axios.get(`${API_URL}/client/${brd.id}`, {
        withCredentials: true,
      });

      if (response.data?.data) {
        setSelectedBRD(normalizeBRD(response.data.data));
      }
    } catch (error) {
      console.error("Failed to fetch BRD details:", error);

      showToast.error(getErrorMessage(error, "Failed to load BRD details."));
    }
  };

  const closeDetails = () => {
    if (submitting) return;
    setSelectedBRD(null);
    setComment("");
  };

  const openDocument = (brd) => {
    const version = brd.version;

    if (!version?.uuid) {
      showToast.error("BRD version UUID not found.");
      return;
    }

    window.open(
      `${API_URL}/versions/${version.uuid}/file`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const submitDecision = async (action) => {
    if (!selectedBRD || submitting) return;

    if (action === "REJECTED" && !comment.trim()) {
      showToast.error("Please provide a reason for rejecting the BRD.");
      return;
    }

    const isApproval = action === "APPROVED";

    try {
      const result = await showAlert.confirm({
        title: isApproval ? "Approve this BRD?" : "Request changes?",
        text: isApproval
          ? "Your approval will complete the BRD approval workflow."
          : "The BRD will be returned for corrections. Your reason will be saved.",
        confirmButtonText: isApproval ? "Approve BRD" : "Reject BRD",
        cancelButtonText: "Cancel",
      });

      const confirmed =
        typeof result === "boolean" ? result : Boolean(result?.isConfirmed);

      if (!confirmed) return;

      setSubmitting(true);

      const response = await axios.patch(
        `${API_URL}/client/${selectedBRD.id}/decision`,
        {
          action,
          message: comment.trim() || null,
        },
        { withCredentials: true },
      );

      showToast.success(
        response.data?.message ||
          (isApproval
            ? "BRD approved successfully."
            : "Changes requested successfully."),
      );

      setSelectedBRD(null);
      setComment("");

      await fetchBRDs(true);
    } catch (error) {
      console.error("Failed to submit BRD decision:", error);

      showToast.error(
        getErrorMessage(error, "Failed to submit your decision."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const reviewHistory = useMemo(() => {
    const versions = selectedBRD?.versions || [];

    return versions
      .flatMap((version) =>
        (version.reviews || []).map((review) => ({
          ...review,
          versionNumber: version.version,
        })),
      )
      .sort(
        (a, b) =>
          new Date(b.reviewedAt || 0).getTime() -
          new Date(a.reviewedAt || 0).getTime(),
      );
  }, [selectedBRD]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">BRD Approval</h1>

          <p className="mt-1 text-sm text-cm-text-muted">
            Review the latest business requirements, add remarks, and approve or
            request changes.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => fetchBRDs(true)}
          disabled={loading || refreshing}
          loading={refreshing}
        >
          {!refreshing && <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="All BRDs"
          value={counts.all}
          icon={FileText}
          description="Assigned to your account"
        />

        <SummaryCard
          title="Awaiting Review"
          value={counts.pending}
          icon={Clock3}
          description="Requires your decision"
        />

        <SummaryCard
          title="Approved"
          value={counts.approved}
          icon={CheckCircle2}
          description="Approval completed"
        />

        <SummaryCard
          title="Changes Requested"
          value={counts.rejected}
          icon={XCircle}
          description="Returned for corrections"
        />
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card shadow-sm">
        <div className="border-b border-cm-border p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-cm-text">
                Your Business Requirements
              </h2>

              <p className="mt-1 text-sm text-cm-text-muted">
                {filteredBRDs.length} BRD
                {filteredBRDs.length !== 1 ? "s" : ""} found
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cm-text-muted" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search project or document..."
                aria-label="Search BRDs"
                className="w-full rounded-cm-md border border-cm-border bg-cm-card py-2.5 pl-9 pr-3 text-sm text-cm-text outline-none focus:border-cm-primary"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  activeFilter === filter.value
                    ? "border-cm-primary bg-cm-primary/10 font-medium text-cm-primary"
                    : "border-cm-border text-cm-text-muted hover:bg-cm-bg"
                }`}
              >
                {filter.label}
                {filter.value === "PENDING" && (
                  <span className="ml-2">{counts.pending}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader context="section" label="Loading your BRDs..." />
          </div>
        ) : loadError && brds.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
            <FileText className="h-9 w-9 text-cm-text-muted" />
            <h3 className="mt-3 font-semibold text-cm-text">
              Unable to load BRDs
            </h3>
            <p className="mt-1 text-sm text-cm-text-muted">{loadError}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchBRDs()}
            >
              Try again
            </Button>
          </div>
        ) : filteredBRDs.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
            <FileText className="h-9 w-9 text-cm-text-muted" />
            <h3 className="mt-3 font-semibold text-cm-text">No BRDs found</h3>
            <p className="mt-1 text-sm text-cm-text-muted">
              {search
                ? "Try another search term."
                : activeFilter === "PENDING"
                  ? "There are no BRDs waiting for your review."
                  : "No BRDs match this filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-cm-bg text-xs uppercase tracking-wide text-cm-text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Document</th>
                  <th className="px-5 py-3 font-medium">Last Updated</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-cm-border">
                {filteredBRDs.map((brd) => (
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
                      <p className="max-w-56 truncate text-sm font-medium text-cm-text">
                        {brd.fileName}
                      </p>
                      <p className="mt-1 text-xs text-cm-text-muted">
                        Version{" "}
                        {brd.version?.version ??
                          brd.version?.versionNumber ??
                          "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-cm-text-muted">
                      {formatDate(brd.uploadedAt || brd.updatedAt)}
                    </td>

                    <td className="px-5 py-4">
                      <Badge tone={STATUS_TONE[brd.status] || "neutral"}>
                        {STATUS_LABEL[brd.status] || brd.status || "Unknown"}
                      </Badge>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetails(brd)}
                        >
                          <Eye className="mr-1.5 h-4 w-4" />
                          View BRD
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* BRD details and decision panel */}
      {selectedBRD && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-brd-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-cm-lg border border-cm-border bg-cm-card shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-cm-border p-5">
              <div>
                <p className="text-xs font-medium text-cm-text-muted">
                  BUSINESS REQUIREMENTS
                </p>

                <h2
                  id="client-brd-title"
                  className="mt-1 text-lg font-semibold text-cm-text"
                >
                  {selectedBRD.projectName}
                </h2>

                <p className="mt-1 text-sm text-cm-text-muted">
                  {selectedBRD.title || selectedBRD.fileName}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                disabled={submitting}
                className="rounded-lg p-2 text-cm-text-muted hover:bg-cm-bg"
                aria-label="Close BRD details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone={STATUS_TONE[selectedBRD.status] || "neutral"}>
                  {STATUS_LABEL[selectedBRD.status] || selectedBRD.status}
                </Badge>

                <span className="text-sm text-cm-text-muted">
                  Updated {formatDate(selectedBRD.updatedAt)}
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
                  label="Uploaded By"
                  value={getPersonName(selectedBRD.version?.uploader)}
                />
                <DetailItem
                  icon={CalendarDays}
                  label="Upload Date"
                  value={formatDate(selectedBRD.uploadedAt)}
                />
                <DetailItem
                  icon={FileText}
                  label="Version"
                  value={
                    selectedBRD.version?.version ??
                    selectedBRD.version?.versionNumber ??
                    "—"
                  }
                />
              </div>

              {selectedBRD.description && (
                <div className="rounded-lg border border-cm-border p-4">
                  <h3 className="text-sm font-semibold text-cm-text">
                    BRD Description
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-cm-text-muted">
                    {selectedBRD.description}
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-cm-border p-4">
                <h3 className="font-semibold text-cm-text">BRD Document</h3>
                <p className="mt-1 text-sm text-cm-text-muted">
                  Open the latest uploaded version to review the requirements.
                </p>

                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => openDocument(selectedBRD)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Document
                </Button>
              </div>

              {/* Version history */}
              {selectedBRD.versions?.length > 0 && (
                <div className="rounded-lg border border-cm-border p-4">
                  <h3 className="font-semibold text-cm-text">
                    Version History
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
                          <div>
                            <p className="text-sm font-medium text-cm-text">
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

              {/* Review history */}
              <div className="rounded-lg border border-cm-border p-4">
                <h3 className="font-semibold text-cm-text">Review History</h3>

                {reviewHistory.length === 0 ? (
                  <p className="mt-3 text-sm text-cm-text-muted">
                    No review comments have been recorded yet.
                  </p>
                ) : (
                  <div className="mt-3 space-y-4">
                    {reviewHistory.map((review) => (
                      <div
                        key={review.uuid || review.id}
                        className="border-l-2 border-cm-border pl-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge
                            tone={
                              review.action === "APPROVED"
                                ? "success"
                                : "danger"
                            }
                          >
                            {review.reviewerRole === "admin"
                              ? "Admin"
                              : "Client"}{" "}
                            {review.action === "APPROVED"
                              ? "Approved"
                              : "Rejected"}
                          </Badge>

                          <span className="text-xs text-cm-text-muted">
                            {formatDate(review.reviewedAt)}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-medium text-cm-text">
                          {getPersonName(review.reviewer) || "Reviewer"}
                        </p>

                        {review.message && (
                          <p className="mt-1 whitespace-pre-wrap text-sm text-cm-text-muted">
                            {review.message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Decision form */}
              {selectedBRD.status === STATUS.PENDING_CLIENT ? (
                <div className="space-y-4 border-t border-cm-border pt-5">
                  <h3 className="font-semibold text-cm-text">Your Decision</h3>

                  <p className="text-sm text-cm-text-muted">
                    Add an optional approval comment or explain the changes
                    required. A rejection reason is mandatory.
                  </p>

                  <Textarea
                    label="Approval comment / rejection reason"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Enter your comments about the requirements..."
                    disabled={submitting}
                  />

                  <div className="flex flex-wrap justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => submitDecision("REJECTED")}
                      disabled={submitting || !comment.trim()}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Request Changes
                    </Button>

                    <Button
                      onClick={() => submitDecision("APPROVED")}
                      disabled={submitting}
                      loading={submitting}
                    >
                      {!submitting && <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Approve BRD
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-cm-bg p-4">
                  <p className="text-sm text-cm-text-muted">
                    {selectedBRD.status === STATUS.APPROVED
                      ? "This BRD has been approved. No further client decision is available."
                      : selectedBRD.status === STATUS.CLIENT_REJECTED
                        ? "Changes were requested for this BRD. Review the recorded comments above."
                        : "This BRD is not currently awaiting client approval."}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
