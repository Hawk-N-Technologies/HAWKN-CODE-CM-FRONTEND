import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  Bug,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  Layers3,
  Pencil,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { showToast } from "../../components/common/Toast";

const STATUSES = [
  "Submitted",
  "Under Review",
  "Confirmed",
  "Feature Request",
  "Rejected",
  "Solved",
];
const CLASSIFICATIONS = ["Bug", "Feature Request"];

const STATUS_TONES = {
  Submitted: "info",
  "Under Review": "warning",
  Confirmed: "success",
  "Feature Request": "info",
  Rejected: "danger",
};

const SEVERITY_TONES = {
  Low: "neutral",
  Medium: "info",
  High: "warning",
  Critical: "danger",
};

const EMPTY_EDIT_FORM = { status: "Submitted", classification: "Bug" };

const getIssuesList = (response) => {
  const payload = response?.data?.data ?? response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.issues)) return payload.issues;
  return [];
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

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const getIssueNumber = (issue) =>
  `ISSUE-${String(issue.id ?? "—").padStart(3, "0")}`;

function MetricCard({ icon: Icon, label, value, detail, accent }) {
  const styles = {
    neutral:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    amber:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    red: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  };

  return (
    <div className="group rounded-2xl border border-cm-border/80 bg-cm-card p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/[0.04] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-cm-text-muted">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-cm-text tabular-nums">
            {value}
          </p>
          <p className="mt-1 text-xs text-cm-text-muted">{detail}</p>
        </div>
        <span
          className={`rounded-xl p-2.5 ${styles[accent] || styles.neutral}`}
        >
          <Icon size={19} strokeWidth={1.9} />
        </span>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, icon: Icon }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-medium text-cm-text-muted">
        {label}
      </span>
      <span className="relative block">
        {Icon && (
          <Icon
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cm-text-muted"
          />
        )}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full appearance-none rounded-xl border border-cm-border bg-cm-bg pr-9 text-sm text-cm-text outline-none transition focus:border-cm-navy-950 focus:ring-4 focus:ring-cm-navy-950/10 ${
            Icon ? "pl-9" : "pl-3"
          }`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cm-text-muted"
        />
      </span>
    </label>
  );
}

function IssueCard({ issue, onEdit }) {
  return (
    <article className="group rounded-2xl border border-cm-border/80 bg-cm-card p-4 transition duration-200 hover:border-cm-navy-950/30 hover:shadow-lg hover:shadow-slate-900/[0.04] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-cm-text-muted">
            <span className="font-mono font-semibold tracking-wide">
              {getIssueNumber(issue)}
            </span>
            <span className="h-1 w-1 rounded-full bg-current opacity-40" />
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={12} />
              {formatDate(issue.createdAt)}
            </span>
          </div>
          <h3 className="mt-2 break-words text-[15px] font-semibold leading-6 text-cm-text transition group-hover:text-cm-navy-950 dark:group-hover:text-[#0B1B33]">
            {issue.title || "Untitled issue"}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => onEdit(issue)}
          aria-label={`Update ${issue.title || getIssueNumber(issue)}`}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-cm-border bg-cm-bg px-3 text-xs font-semibold text-cm-text transition hover:border-cm-navy-950/40 hover:bg-cm-navy-950/5 dark:hover:bg-cm-navy-950/30"
        >
          <Pencil size={13} />
          <span>Update</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={SEVERITY_TONES[issue.severity] || "neutral"}>
          {issue.severity || "Unspecified severity"}
        </Badge>
        <Badge tone={STATUS_TONES[issue.status] || "neutral"}>
          {issue.status || "Unknown status"}
        </Badge>
        <Badge tone="neutral">{issue.classification || "Unclassified"}</Badge>
      </div>

      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-cm-text-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
        {issue.description || "No description provided."}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-cm-border/70 pt-4 sm:grid-cols-3">
        {[
          ["Project", issue.projectName],
          ["Module", issue.moduleName],
          ["Reviewed by", issue.reviewedBy || "Not reviewed"],
        ].map(([label, value]) => (
          <div className="min-w-0" key={label}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cm-text-muted">
              {label}
            </p>
            <p className="mt-1 truncate text-sm font-medium text-cm-text">
              {value || "—"}
            </p>
          </div>
        ))}
      </div>

      {issue.reviewNotes && (
        <div className="mt-4 rounded-xl border border-amber-200/70 bg-amber-50/70 px-3.5 py-3 dark:border-amber-900/60 dark:bg-amber-950/20">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-800 dark:text-amber-300">
            Review notes
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-amber-950 dark:text-amber-100">
            {issue.reviewNotes}
          </p>
        </div>
      )}
    </article>
  );
}

export default function Bugs() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [editIssue, setEditIssue] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);

  const getIssues = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/bugs/issuesForTester", {
        withCredentials: true,
      });
      if (response.status === 200) setIssues(getIssuesList(response));
    } catch (error) {
      showToast.error(getErrorMessage(error, "Failed to fetch issues."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getIssues();
  }, [getIssues]);

  const filteredIssues = useMemo(() => {
    const query = search.trim().toLowerCase();
    return issues.filter((issue) => {
      const matchesStatus = !statusFilter || issue.status === statusFilter;
      const matchesSeverity =
        !severityFilter || issue.severity === severityFilter;
      const matchesSearch =
        !query ||
        [
          issue.id,
          issue.uuid,
          issue.title,
          issue.description,
          issue.severity,
          issue.status,
          issue.classification,
          issue.projectName,
          issue.moduleName,
        ]
          .filter((value) => value !== null && value !== undefined)
          .some((value) => String(value).toLowerCase().includes(query));
      return matchesStatus && matchesSeverity && matchesSearch;
    });
  }, [issues, search, statusFilter, severityFilter]);

  const metrics = useMemo(
    () => ({
      total: issues.length,
      submitted: issues.filter((issue) => issue.status === "Submitted").length,
      review: issues.filter((issue) => issue.status === "Under Review").length,
      critical: issues.filter(
        (issue) =>
          issue.severity === "Critical" && issue.status !== "Confirmed",
      ).length,
    }),
    [issues],
  );

  const openEditModal = (issue) => {
    setEditIssue(issue);
    setEditForm({
      status: issue.status || "Submitted",
      classification: issue.classification || "Bug",
    });
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditIssue(null);
    setEditForm(EMPTY_EDIT_FORM);
  };

  const updateEditField = (field, value) => {
    setEditForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleUpdateIssue = async (event) => {
    event.preventDefault();
    if (!editIssue) return;

    if (
      !STATUSES.includes(editForm.status) ||
      !CLASSIFICATIONS.includes(editForm.classification)
    ) {
      showToast.error("Please select a valid status and classification.");
      return;
    }

    setSaving(true);
    try {
      const response = await axios.patch(
        `/api/bugs/issues/${editIssue.uuid}/status`,
        editForm,
        { withCredentials: true },
      );
      if (response.status === 200 || response.status === 201) {
        showToast.success("Issue updated successfully.");
        setEditIssue(null);
        setEditForm(EMPTY_EDIT_FORM);
        await getIssues();
      }
    } catch (error) {
      showToast.error(getErrorMessage(error, "Failed to update issue."));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!editIssue) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeEditModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editIssue, saving]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setSeverityFilter("");
  };
  const hasFilters = Boolean(search || statusFilter || severityFilter);

  return (
    <main className="mx-auto flex w-full max-w-[1480px] flex-col gap-7 pb-10">
      {/* Page introduction */}
      <section className="relative overflow-hidden rounded-[26px] border border-cm-border bg-cm-card px-5 py-6 sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-cm-navy-950/[0.045] blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cm-navy-950 text-white shadow-lg shadow-cm-navy-950/15">
              <Bug size={22} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cm-text-muted">
                  Quality workspace
                </p>
                <span className="rounded-full border border-cm-border bg-cm-bg px-2.5 py-1 text-[11px] font-medium text-cm-text-muted">
                  {issues.length} reports
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-cm-text sm:text-[30px]">
                Issues for Testing
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-cm-text-muted">
                Triage incoming reports, prioritize critical bugs, and keep
                every issue moving toward resolution.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={getIssues}
            disabled={loading}
          >
            <span className="flex items-center gap-2">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </span>
          </Button>
        </div>
      </section>

      {/* At-a-glance metrics */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Layers3}
          label="Total reports"
          value={metrics.total}
          detail="All submitted issues"
          accent="neutral"
        />
        <MetricCard
          icon={AlertCircle}
          label="New submissions"
          value={metrics.submitted}
          detail="Awaiting initial review"
          accent="blue"
        />
        <MetricCard
          icon={Clock3}
          label="Under review"
          value={metrics.review}
          detail="Currently being investigated"
          accent="amber"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Critical priority"
          value={metrics.critical}
          detail="Not yet confirmed"
          accent="red"
        />
      </section>

      {/* Search and filters */}
      <section className="rounded-2xl border border-cm-border/80 bg-cm-card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cm-bg text-cm-text-muted">
              <Filter size={15} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-cm-text">
                Find a report
              </h2>
              <p className="text-xs text-cm-text-muted">
                Search and narrow down your issue queue
              </p>
            </div>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-cm-text-muted transition hover:text-cm-text"
            >
              Reset filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(180px,1fr)_minmax(160px,0.8fr)]">
          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-medium text-cm-text-muted">
              Search reports
            </span>
            <span className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cm-text-muted"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, ID, project or description..."
                className="h-11 w-full rounded-xl border border-cm-border bg-cm-bg pl-10 pr-3 text-sm text-cm-text outline-none transition placeholder:text-cm-text-muted/70 focus:border-cm-navy-950 focus:ring-4 focus:ring-cm-navy-950/10"
              />
            </span>
          </label>

          <SelectField
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            icon={CheckCircle2}
            options={[
              { value: "", label: "All statuses" },
              ...STATUSES.map((status) => ({ value: status, label: status })),
            ]}
          />

          <SelectField
            label="Severity"
            value={severityFilter}
            onChange={setSeverityFilter}
            icon={ShieldAlert}
            options={[
              { value: "", label: "All severities" },
              ...["Critical", "High", "Medium", "Low"].map((severity) => ({
                value: severity,
                label: severity,
              })),
            ]}
          />
        </div>
      </section>

      {/* Issue results */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-cm-text">
                Reported issues
              </h2>
              {hasFilters && (
                <span className="rounded-full bg-cm-navy-950/10 px-2 py-0.5 text-[10px] font-semibold text-cm-navy-950 dark:bg-cm-navy-950/30 dark:text-white">
                  Filtered
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-cm-text-muted">
              Showing {filteredIssues.length} of {issues.length} reports
            </p>
          </div>
          <p className="text-xs text-cm-text-muted">
            Sorted by latest submission
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-cm-border bg-cm-card p-8">
            <Loader />
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-cm-border bg-cm-card px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cm-bg text-cm-text-muted">
              <Bug size={24} strokeWidth={1.7} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-cm-text">
              {issues.length === 0
                ? "Your issue queue is clear"
                : "No matching reports"}
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-cm-text-muted">
              {issues.length === 0
                ? "New issue reports will appear here as soon as they are submitted."
                : "Try another keyword or adjust the selected filters."}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-semibold text-cm-text underline-offset-4 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue.uuid || issue.id}
                issue={issue}
                onEdit={openEditModal}
              />
            ))}
          </div>
        )}
      </section>

      {/* Update issue dialog */}
      {editIssue && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-issue-title"
            className="my-auto w-full max-w-lg overflow-hidden rounded-[24px] border border-cm-border bg-cm-card shadow-2xl shadow-slate-950/25"
          >
            <div className="flex items-start justify-between gap-4 border-b border-cm-border px-5 py-5 sm:px-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cm-navy-950 text-white">
                  <Pencil size={17} />
                </div>
                <div className="min-w-0">
                  <h2
                    id="edit-issue-title"
                    className="text-lg font-semibold text-cm-text"
                  >
                    Update issue
                  </h2>
                  <p className="mt-1 break-words text-xs text-cm-text-muted">
                    {getIssueNumber(editIssue)} ·{" "}
                    {editIssue.title || "Untitled issue"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                aria-label="Close update dialog"
                className="rounded-lg p-2 text-cm-text-muted transition hover:bg-cm-bg hover:text-cm-text disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleUpdateIssue}
              className="space-y-5 px-5 py-5 sm:px-6"
            >
              <div className="rounded-xl border border-cm-border bg-cm-bg p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-cm-text-muted">
                  Report summary
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-cm-text">
                  {editIssue.description || "No description provided."}
                </p>
              </div>

              <SelectField
                label="Issue status"
                value={editForm.status}
                onChange={(value) => updateEditField("status", value)}
                options={STATUSES.map((status) => ({
                  value: status,
                  label: status,
                }))}
              />

              <SelectField
                label="Classification"
                value={editForm.classification}
                onChange={(value) => updateEditField("classification", value)}
                options={CLASSIFICATIONS.map((classification) => ({
                  value: classification,
                  label: classification,
                }))}
              />

              <div className="flex flex-col-reverse gap-2 border-t border-cm-border pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={closeEditModal}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader />
                      Saving changes...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Check size={15} />
                      Save changes
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
