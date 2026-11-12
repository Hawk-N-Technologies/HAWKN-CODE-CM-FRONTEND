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
  Solved: "success",
};

const SEVERITY_TONES = {
  Low: "neutral",
  Medium: "info",
  High: "warning",
  Critical: "danger",
};

const EMPTY_EDIT_FORM = {
  status: "Submitted",
  classification: "Bug",
};

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

function PageHeader({ total, onRefresh, loading }) {
  return (
    <section className="relative isolate overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border border-blue-300/10" />
      <div className="pointer-events-none absolute -right-5 -top-12 -z-10 h-52 w-52 rounded-full border border-blue-300/10" />
      <div className="pointer-events-none absolute -bottom-28 right-1/4 -z-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-center">
        <div className="min-w-0 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              Quality Assurance
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-[34px]">
            Issues for Testing
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-[15px]">
            Review incoming issue reports, prioritize critical bugs, and manage
            issue classifications and resolution statuses.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
              {total} Total Reports
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-200">
              Live Issue Queue
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-5 py-4 backdrop-blur-sm sm:min-w-[150px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Total Reports
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-white">
              {total}
            </p>
            <p className="mt-1 text-xs text-slate-400">Current issue queue</p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={onRefresh}
            disabled={loading}
          >
            <span className="flex items-center gap-2">
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
}

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
    <article className="group rounded-[20px] border border-cm-border/80 bg-cm-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-cm-text-muted">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-cm-text tabular-nums">
            {value}
          </p>

          <p className="mt-1 text-xs text-cm-text-muted">{detail}</p>
        </div>

        <span className={`rounded-xl p-2.5 ${styles[accent] || styles.neutral}`}>
          <Icon size={19} strokeWidth={1.9} />
        </span>
      </div>
    </article>
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
    <article className="group rounded-[22px] border border-cm-border/80 bg-cm-card p-5 shadow-sm transition-all duration-200 hover:border-cm-navy-950/30 hover:shadow-md">
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

          <h3 className="mt-2 break-words text-[15px] font-semibold leading-6 text-cm-text transition group-hover:text-cm-navy-950 dark:group-hover:text-blue-300">
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

        <Badge tone="neutral">
          {issue.classification || "Unclassified"}
        </Badge>
      </div>

      <p className="mt-4 overflow-hidden whitespace-pre-wrap break-words text-sm leading-6 text-cm-text-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
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

function EmptyState({ hasIssues, hasFilters, onClearFilters }) {
  return (
    <div className="rounded-[22px] border border-dashed border-cm-border bg-cm-card px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cm-bg text-cm-text-muted">
        <Bug size={24} strokeWidth={1.7} />
      </div>

      <h3 className="mt-4 text-base font-semibold text-cm-text">
        {hasIssues ? "No matching reports" : "Your issue queue is clear"}
      </h3>

      <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-cm-text-muted">
        {hasIssues
          ? "Try another keyword or adjust the selected filters."
          : "New issue reports will appear here as soon as they are submitted."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 text-sm font-semibold text-cm-text underline-offset-4 hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

function UpdateIssueModal({
  issue,
  editForm,
  onUpdateField,
  onClose,
  onSubmit,
  saving,
}) {
  if (!issue) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-issue-title"
        className="my-auto w-full max-w-lg overflow-hidden rounded-[24px] border border-slate-200 bg-cm-card shadow-[0_25px_80px_rgba(2,6,23,0.3)]"
      >
        <header className="relative isolate overflow-hidden bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-5 py-5 sm:px-6">
          <div className="pointer-events-none absolute -right-10 -top-16 -z-10 h-48 w-48 rounded-full border border-blue-300/10" />

          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-blue-200">
                <Pencil size={17} />
              </div>

              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-2.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                    Issue Management
                  </span>
                </div>

                <h2
                  id="edit-issue-title"
                  className="text-lg font-bold tracking-tight text-white"
                >
                  Update Issue
                </h2>

                <p className="mt-1 break-words text-xs text-slate-300">
                  {getIssueNumber(issue)} · {issue.title || "Untitled issue"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close update dialog"
              className="rounded-lg border border-white/10 bg-white/[0.07] p-2 text-slate-300 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <form onSubmit={onSubmit} className="space-y-5 px-5 py-5 sm:px-6">
          <div className="rounded-xl border border-cm-border bg-cm-bg p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-cm-text-muted">
              Report Summary
            </p>

            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-cm-text">
              {issue.description || "No description provided."}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={SEVERITY_TONES[issue.severity] || "neutral"}>
                {issue.severity || "Unspecified severity"}
              </Badge>

              <Badge tone={STATUS_TONES[issue.status] || "neutral"}>
                {issue.status || "Unknown status"}
              </Badge>
            </div>
          </div>

          <SelectField
            label="Issue Status"
            value={editForm.status}
            onChange={(value) => onUpdateField("status", value)}
            options={STATUSES.map((status) => ({
              value: status,
              label: status,
            }))}
          />

          <SelectField
            label="Classification"
            value={editForm.classification}
            onChange={(value) => onUpdateField("classification", value)}
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
              onClick={onClose}
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
                  Save Changes
                </span>
              )}
            </Button>
          </div>
        </form>
      </section>
    </div>
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

      if (response.status === 200) {
        setIssues(getIssuesList(response));
      }
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
    setEditForm((previous) => ({
      ...previous,
      [field]: value,
    }));
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
      if (event.key === "Escape") {
        closeEditModal();
      }
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
    <main className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 pb-10 sm:gap-7">
      <PageHeader
        total={issues.length}
        onRefresh={getIssues}
        loading={loading}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Layers3}
          label="Total Reports"
          value={metrics.total}
          detail="All submitted issues"
          accent="neutral"
        />

        <MetricCard
          icon={AlertCircle}
          label="New Submissions"
          value={metrics.submitted}
          detail="Awaiting initial review"
          accent="blue"
        />

        <MetricCard
          icon={Clock3}
          label="Under Review"
          value={metrics.review}
          detail="Currently being investigated"
          accent="amber"
        />

        <MetricCard
          icon={ShieldAlert}
          label="Critical Priority"
          value={metrics.critical}
          detail="Not yet confirmed"
          accent="red"
        />
      </section>

      <section className="rounded-[22px] border border-cm-border/80 bg-cm-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cm-border bg-cm-bg text-cm-text-muted">
              <Filter size={17} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-cm-text">
                Find a Report
              </h2>

              <p className="text-xs text-cm-text-muted">
                Search and narrow down your issue queue.
              </p>
            </div>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-cm-text-muted transition hover:text-cm-text"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(180px,1fr)_minmax(160px,0.8fr)]">
          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-medium text-cm-text-muted">
              Search Reports
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
              ...STATUSES.map((status) => ({
                value: status,
                label: status,
              })),
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

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-cm-text">
                Reported Issues
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
          <div className="flex min-h-64 items-center justify-center rounded-[22px] border border-cm-border bg-cm-card p-8">
            <Loader />
          </div>
        ) : filteredIssues.length === 0 ? (
          <EmptyState
            hasIssues={issues.length > 0}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
          />
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

      <UpdateIssueModal
        issue={editIssue}
        editForm={editForm}
        onUpdateField={updateEditField}
        onClose={closeEditModal}
        onSubmit={handleUpdateIssue}
        saving={saving}
      />
    </main>
  );
}
