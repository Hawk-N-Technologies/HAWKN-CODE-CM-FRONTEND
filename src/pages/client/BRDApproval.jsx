
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  X,
  Building2,
  UserRound,
  Sparkles,
  ShieldCheck,
  MessageSquareText,
  History,
  Download,
  AlertCircle,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Textarea from "../../components/common/TextArea";
import Loader from "../../components/common/Loader";
import { showToast } from "../../components/common/Toast";
import showAlert from "../../components/common/Alert";

const API_URL = "/api/brds";

// -----------------------------------------------------------------------------
// Statuses and helpers
// -----------------------------------------------------------------------------

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
  [STATUS.PENDING_ADMIN]: "Pending admin review",
  [STATUS.ADMIN_REJECTED]: "Admin rejected",
  [STATUS.PENDING_CLIENT]: "Awaiting your review",
  [STATUS.CLIENT_REJECTED]: "Changes requested",
  [STATUS.APPROVED]: "Approved",
};

const FILTERS = [
  { value: "PENDING", label: "Awaiting my review" },
  { value: "ALL", label: "All BRDs" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Changes requested" },
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

const formatFileSize = (bytes) => {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return null;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
    projectName: brd.project?.name || brd.title || "Untitled project",
    clientName:
      getPersonName(brd.client?.user) || getPersonName(brd.client) || "—",
    creatorName: getPersonName(brd.creator) || getPersonName(brd.user) || "—",
    fileName: version?.fileName || "BRD document",
    uploadedAt: version?.createdAt || brd.createdAt,
  };
};

const getFileUrl = (version) =>
  version?.uuid ? `${API_URL}/versions/${version.uuid}/file` : null;

const getStatusClass = (status) => {
  if (status === STATUS.APPROVED) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === STATUS.CLIENT_REJECTED || status === STATUS.ADMIN_REJECTED) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === STATUS.PENDING_CLIENT || status === STATUS.PENDING_ADMIN) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
};

// -----------------------------------------------------------------------------
// Reusable UI components
// -----------------------------------------------------------------------------

function SummaryCard({ title, value, icon: Icon, description, accent }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-slate-900/[0.035] transition-transform duration-300 group-hover:scale-125" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {title}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-[#101a3a]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${accent || "bg-blue-50 text-blue-700"}`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
      </div>

      <p className="relative mt-3 text-xs text-slate-500">{description}</p>
    </article>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function ModalFrame({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
  eyebrow = "CLIENT WORKSPACE",
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full ${
          wide ? "max-w-6xl" : "max-w-4xl"
        } flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl`}
      >
        <header className="relative isolate overflow-hidden border-b border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-5 py-5 text-white sm:px-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-14 -top-24 h-56 w-56 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-5 -top-14 h-40 w-40 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 h-48 w-48 bg-blue-500/10 blur-3xl"
          />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                {eyebrow}
              </span>

              <h2 className="mt-2 break-words text-lg font-bold tracking-tight text-white sm:text-xl">
                {title}
              </h2>

              {subtitle && (
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300 sm:text-sm">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {children}

        {footer && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}

function FilterPill({ active, children, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-1 ${
        active
          ? "border-[#101a3a] bg-[#101a3a] text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-[#101a3a]"
      }`}
    >
      {children}

      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] ${
            active
              ? "bg-white/15 text-white"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function SectionHeading({ eyebrow, title, description, icon: Icon }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
          <Icon className="h-5 w-5" />
        </div>
      )}

      <div>
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {eyebrow}
          </p>
        )}
        <h3 className="mt-1 text-base font-bold text-[#101a3a]">{title}</h3>
        {description && (
          <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// BRD approval page
// -----------------------------------------------------------------------------

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

  const [documentPreview, setDocumentPreview] = useState(null);
  const documentRequestId = useRef(0);

  // Revoke the temporary object URL when the preview is closed or replaced.
  useEffect(() => {
    if (!documentPreview?.url) return undefined;
    return () => URL.revokeObjectURL(documentPreview.url);
  }, [documentPreview?.url]);

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

  const openDocument = async (brdOrVersion) => {
    const version = brdOrVersion.version || brdOrVersion;
    const fileUrl = getFileUrl(version);

    if (!fileUrl) {
      showToast.error("BRD version UUID not found.");
      return;
    }

    const requestId = ++documentRequestId.current;

    setDocumentPreview({
      fileName: version.fileName || "BRD document",
      mimeType: version.mimeType || "",
      fileSize: version.fileSize,
      loading: true,
      error: null,
      url: null,
    });

    try {
      // Use Axios so configured auth interceptors and credentials are applied.
      const response = await axios.get(fileUrl, {
        withCredentials: true,
        responseType: "blob",
      });

      if (requestId !== documentRequestId.current) return;

      const mimeType =
        response.data?.type || version.mimeType || "application/octet-stream";
      const blob = new Blob([response.data], { type: mimeType });
      const url = URL.createObjectURL(blob);

      setDocumentPreview((current) =>
        current
          ? { ...current, loading: false, error: null, url, mimeType }
          : current,
      );
    } catch (error) {
      if (requestId !== documentRequestId.current) return;

      const serverMessage =
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : null;

      setDocumentPreview((current) =>
        current
          ? {
              ...current,
              loading: false,
              error:
                serverMessage ||
                "The document could not be loaded. Check your access and try again.",
            }
          : current,
      );
    }
  };

  const closeDocument = () => {
    documentRequestId.current += 1;
    setDocumentPreview(null);
  };

  const submitDecision = async (action) => {
    if (!selectedBRD || submitting) return;

    if (action === "REJECTED" && !comment.trim()) {
      showToast.error("Please provide a reason for requesting changes.");
      return;
    }

    const isApproval = action === "APPROVED";

    try {
      const result = await showAlert.confirm({
        title: isApproval ? "Approve this BRD?" : "Request changes?",
        text: isApproval
          ? "Your approval will complete the BRD approval workflow."
          : "The BRD will be returned for corrections. Your reason will be saved.",
        confirmButtonText: isApproval ? "Approve BRD" : "Request changes",
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
    <div className="min-h-full space-y-7 pb-8">
      {/* Page header */}
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              <Sparkles className="h-3.5 w-3.5" />
              Client workspace
            </span>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
              BRD Approval
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Review business requirements, inspect document versions and keep
              delivery aligned with your expectations.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200">
                Awaiting your review
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                {loading ? "—" : counts.pending}
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchBRDs(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing…" : "Refresh BRDs"}
            </button>
          </div>
        </div>
      </header>

      {/* Summary */}
      <section>
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Approval overview
          </p>
          <h2 className="mt-1 text-lg font-bold text-[#101a3a]">
            Your BRD activity
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="All BRDs"
            value={loading ? "—" : counts.all}
            icon={FileText}
            description="Assigned to your account"
            accent="bg-blue-50 text-blue-700"
          />
          <SummaryCard
            title="Awaiting review"
            value={loading ? "—" : counts.pending}
            icon={Clock3}
            description="Requires your decision"
            accent="bg-amber-50 text-amber-700"
          />
          <SummaryCard
            title="Approved"
            value={loading ? "—" : counts.approved}
            icon={CheckCircle2}
            description="Approval completed"
            accent="bg-emerald-50 text-emerald-700"
          />
          <SummaryCard
            title="Changes requested"
            value={loading ? "—" : counts.rejected}
            icon={MessageSquareText}
            description="Returned for corrections"
            accent="bg-rose-50 text-rose-700"
          />
        </div>
      </section>

      {/* BRD list */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Document centre
              </p>
              <h2 className="mt-1 text-lg font-bold text-[#101a3a]">
                Business requirements
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredBRDs.length} matching{" "}
                {filteredBRDs.length === 1 ? "document" : "documents"}
              </p>
            </div>

            <label className="relative block w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search project or document…"
                aria-label="Search BRDs"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <FilterPill
                key={filter.value}
                active={activeFilter === filter.value}
                count={filter.value === "PENDING" ? counts.pending : undefined}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </FilterPill>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader context="section" label="Loading your BRDs..." />
          </div>
        ) : loadError && brds.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-[#101a3a]">
              Unable to load BRDs
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">{loadError}</p>
            <button
              type="button"
              onClick={() => fetchBRDs()}
              className="mt-4 rounded-lg bg-[#101a3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1b2a55] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try again
            </button>
          </div>
        ) : filteredBRDs.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-[#101a3a]">
              {search ? "No matching BRDs" : "Nothing to review"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              {search
                ? "Try another search term or choose a different status filter."
                : activeFilter === "PENDING"
                  ? "There are no BRDs waiting for your review."
                  : "No BRDs match this filter."}
            </p>
            {(search || activeFilter !== "PENDING") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveFilter("PENDING");
                }}
                className="mt-3 text-xs font-bold text-blue-800 underline underline-offset-4"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-bold sm:px-6">Project</th>
                  <th className="px-5 py-4 font-bold">Document</th>
                  <th className="px-5 py-4 font-bold">Last updated</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 text-right font-bold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredBRDs.map((brd) => (
                  <tr
                    key={brd.uuid || brd.id}
                    className="transition hover:bg-blue-50/40"
                  >
                    <td className="px-5 py-4 sm:px-6">
                      <p className="font-semibold text-[#101a3a]">
                        {brd.projectName}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Building2 className="h-3.5 w-3.5" />
                        {brd.clientName}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-56 truncate text-sm font-semibold text-slate-800">
                            {brd.fileName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Version{" "}
                            {brd.version?.version ??
                              brd.version?.versionNumber ??
                              "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(brd.uploadedAt || brd.updatedAt)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(brd.status)}`}
                      >
                        {STATUS_LABEL[brd.status] || brd.status || "Unknown"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => openDetails(brd)}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#101a3a] px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1b2a55] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Review BRD
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* BRD details and decision modal */}
      {selectedBRD && (
        <ModalFrame
          title={selectedBRD.projectName}
          subtitle={
            selectedBRD.title || selectedBRD.fileName || "Business requirements"
          }
          onClose={closeDetails}
          eyebrow="BRD REVIEW"
          footer={
            <div className="flex w-full items-center justify-between gap-3">
              <p className="hidden text-xs text-slate-500 sm:block">
                {submitting
                  ? "Saving your decision…"
                  : "Your review is securely submitted to the project team."}
              </p>

              <button
                type="button"
                onClick={closeDetails}
                disabled={submitting}
                className="ml-auto rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="overflow-y-auto bg-slate-50/70 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClass(selectedBRD.status)}`}
              >
                {STATUS_LABEL[selectedBRD.status] || selectedBRD.status}
              </span>

              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" />
                Updated {formatDate(selectedBRD.updatedAt)}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DetailItem
                icon={FileText}
                label="Document"
                value={selectedBRD.fileName}
              />
              <DetailItem
                icon={UserRound}
                label="Uploaded by"
                value={getPersonName(selectedBRD.version?.uploader)}
              />
              <DetailItem
                icon={CalendarDays}
                label="Upload date"
                value={formatDate(selectedBRD.uploadedAt)}
              />
              <DetailItem
                icon={History}
                label="Current version"
                value={
                  selectedBRD.version?.version ??
                  selectedBRD.version?.versionNumber ??
                  "—"
                }
              />
            </div>

            {selectedBRD.description && (
              <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                <SectionHeading
                  eyebrow="Project information"
                  title="BRD description"
                  icon={FileText}
                />
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {selectedBRD.description}
                </p>
              </section>
            )}

            <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionHeading
                  eyebrow="Latest uploaded file"
                  title="BRD document"
                  description="Open the latest uploaded version in the secure preview."
                  icon={FileText}
                />

                <button
                  type="button"
                  onClick={() => openDocument(selectedBRD)}
                  disabled={!selectedBRD.version?.uuid}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#101a3a] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1b2a55] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview document
                </button>
              </div>
            </section>

            {selectedBRD.versions?.length > 0 && (
              <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                <SectionHeading
                  eyebrow="Uploaded revisions"
                  title="Version history"
                  description="Review earlier versions of this BRD."
                  icon={History}
                />

                <div className="mt-4 space-y-2">
                  {[...selectedBRD.versions]
                    .sort(
                      (a, b) => Number(b.version ?? 0) - Number(a.version ?? 0),
                    )
                    .map((version) => {
                      const fileSize = formatFileSize(version.fileSize);
                      const isCurrent =
                        version.uuid === selectedBRD.version?.uuid;

                      return (
                        <div
                          key={version.uuid || version.id}
                          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-800 shadow-sm">
                              <FileText className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {version.fileName || "BRD document"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Version {version.version ?? "—"} ·{" "}
                                {formatDate(version.createdAt)}
                                {fileSize ? ` · ${fileSize}` : ""}
                              </p>
                            </div>

                            {isCurrent && (
                              <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-blue-800">
                                Latest
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => openDocument(version)}
                            disabled={!version.uuid}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-800 transition hover:border-blue-800 hover:bg-blue-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Preview
                          </button>
                        </div>
                      );
                    })}
                </div>
              </section>
            )}

            <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <SectionHeading
                eyebrow="Decision records"
                title="Review history"
                description="Previous approval decisions and recorded feedback."
                icon={MessageSquareText}
              />

              {reviewHistory.length === 0 ? (
                <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                  No review comments have been recorded yet.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {reviewHistory.map((review) => (
                    <div
                      key={review.uuid || review.id}
                      className="border-l-2 border-blue-200 pl-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge
                          tone={
                            review.action === "APPROVED" ? "success" : "danger"
                          }
                        >
                          {review.reviewerRole === "admin" ? "Admin" : "Client"}{" "}
                          {review.action === "APPROVED"
                            ? "approved"
                            : "requested changes"}
                        </Badge>

                        <span className="text-xs text-slate-500">
                          {formatDate(review.reviewedAt)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {getPersonName(review.reviewer) || "Reviewer"}
                      </p>

                      {review.message && (
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {review.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {selectedBRD.status === STATUS.PENDING_CLIENT ? (
              <section className="mt-5 rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#101a3a] text-white">
                    <ShieldCheck className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#101a3a]">
                      Your decision
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Approve the requirements or request changes. A reason is
                      required when requesting changes.
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Textarea
                    label="Approval comment / change request"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Share your feedback about the requirements…"
                    disabled={submitting}
                  />
                </div>

                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => submitDecision("REJECTED")}
                    disabled={submitting || !comment.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Request changes
                  </button>

                  <button
                    type="button"
                    onClick={() => submitDecision("APPROVED")}
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#101a3a] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1b2a55] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {submitting ? "Submitting…" : "Approve BRD"}
                  </button>
                </div>
              </section>
            ) : (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-800" />
                <p className="text-sm leading-6 text-slate-600">
                  {selectedBRD.status === STATUS.APPROVED
                    ? "This BRD has been approved. No further client decision is available."
                    : selectedBRD.status === STATUS.CLIENT_REJECTED
                      ? "Changes were requested for this BRD. Review the recorded comments above."
                      : "This BRD is not currently awaiting client approval."}
                </p>
              </div>
            )}
          </div>
        </ModalFrame>
      )}

      {/* Authenticated document preview modal */}
      {documentPreview && (
        <ModalFrame
          title={documentPreview.fileName || "BRD document"}
          subtitle="Secure document preview"
          onClose={closeDocument}
          wide
          eyebrow="DOCUMENT VIEWER"
          footer={
            <>
              <span className="min-w-0 truncate text-xs text-slate-500">
                {documentPreview.fileName}
              </span>

              <button
                type="button"
                onClick={closeDocument}
                className="rounded-lg bg-[#101a3a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1b2a55] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Close preview
              </button>
            </>
          }
        >
          <div className="flex min-h-[55vh] flex-1 flex-col bg-slate-100">
            {documentPreview.loading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-800" />
                <p className="text-sm font-semibold text-slate-700">
                  Loading document…
                </p>
                <p className="text-xs text-slate-500">
                  Retrieving the file securely.
                </p>
              </div>
            ) : documentPreview.error ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-[#101a3a]">
                  Could not preview this document
                </h3>
                <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                  {documentPreview.error}
                </p>
              </div>
            ) : documentPreview.url ? (
              documentPreview.mimeType === "application/pdf" ||
              documentPreview.mimeType?.startsWith("image/") ? (
                <iframe
                  title={documentPreview.fileName || "BRD document preview"}
                  src={documentPreview.url}
                  className="min-h-[65vh] w-full flex-1 bg-white"
                />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-800 shadow-sm">
                    <FileText className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-[#101a3a]">
                    Preview unavailable for this file type
                  </h3>

                  <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                    This file type cannot be displayed directly in the browser.
                    You can download it to review the contents.
                  </p>

                  <a
                    href={documentPreview.url}
                    download={documentPreview.fileName || "BRD-document"}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#101a3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1b2a55] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Download className="h-4 w-4" />
                    Download document
                  </a>
                </div>
              )
            ) : null}
          </div>
        </ModalFrame>
      )}
    </div>
  );
}
