
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  Bug,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FilePlus2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import Select from "../../components/common/Select";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Badge from "../../components/common/Badge";
import { showToast } from "../../components/common/Toast";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getList = (response, key) => {
  const data = response?.data?.data ?? response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];

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

const severityVariant = {
  Low: "success",
  Medium: "info",
  High: "warning",
  Critical: "danger",
};

const statusVariant = {
  Submitted: "info",
  Open: "danger",
  Assigned: "info",
  "In Progress": "warning",
  Fixed: "success",
  "Ready for Retest": "info",
  Reopened: "warning",
  Closed: "success",
  Rejected: "secondary",
};

const REQUEST_TYPE_OPTIONS = [
  { value: "Bug", label: "Bug" },
  { value: "Issue", label: "Issue" },
  { value: "Change Request", label: "Change request" },
];

const SEVERITY_OPTIONS = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Critical", label: "Critical" },
];

const INITIAL_FORM = {
  projectId: "",
  title: "",
  classification: "Bug",
  severity: "Medium",
  description: "",
};

// ---------------------------------------------------------------------------
// Reusable UI
// ---------------------------------------------------------------------------

function Modal({ children, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="raise-ticket-title"
        className="flex max-h-[min(92vh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_100px_-25px_rgba(2,6,23,0.45)]"
      >
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-800">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-1 text-base font-bold text-cm-navy-950">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-xs leading-5 text-cm-text-muted sm:text-sm">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, style }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-cm-border bg-cm-card p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-blue-500/[0.035] transition-transform duration-300 group-hover:scale-125" />

      <div className="relative flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-cm-text-muted sm:text-sm">
          {label}
        </p>

        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style}`}>
          <Icon size={19} strokeWidth={1.8} />
        </span>
      </div>

      <p className="relative mt-4 text-2xl font-bold tracking-tight text-cm-navy-950 tabular-nums sm:text-3xl">
        {value}
      </p>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Main Client Bugs Page
// ---------------------------------------------------------------------------

export default function Bugs() {
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState(INITIAL_FORM);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // -------------------------------------------------------------------------
  // API: Fetch Reported Issues
  // -------------------------------------------------------------------------

  const fetchReportedIssues = useCallback(async () => {
    setLoadingIssues(true);

    try {
      const response = await axios.get("/api/bugs/issued-bugs", {
        withCredentials: true,
      });

      if (response.status === 200) {
        setIssues(getList(response, "issues"));
      }
    } catch (error) {
      showToast.error(
        getErrorMessage(error, "Failed to fetch reported issues."),
      );
    } finally {
      setLoadingIssues(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // API: Fetch Client Projects
  // -------------------------------------------------------------------------

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);

    try {
      const response = await axios.get("/api/clients/projects-dropdown", {
        withCredentials: true,
      });

      setProjects(getList(response, "projects"));
    } catch (error) {
      showToast.error(getErrorMessage(error, "Failed to load projects."));
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchReportedIssues();
  }, [fetchProjects, fetchReportedIssues]);

  // -------------------------------------------------------------------------
  // Project Dropdown Options
  // -------------------------------------------------------------------------

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: String(project.uuid),
        label: project.name || project.projectName || `Project ${project.id}`,
      })),
    [projects],
  );

  // -------------------------------------------------------------------------
  // Summary Metrics
  // -------------------------------------------------------------------------

  const summary = useMemo(
    () => [
      {
        label: "Total issues",
        value: issues.length,
        icon: Bug,
        style: "border border-blue-100 bg-blue-50 text-blue-800",
      },
      {
        label: "Submitted",
        value: issues.filter((issue) => issue.status === "Submitted").length,
        icon: AlertCircle,
        style: "border border-amber-100 bg-amber-50 text-amber-700",
      },
      {
        label: "In progress",
        value: issues.filter((issue) => issue.status === "In Progress").length,
        icon: Clock3,
        style: "border border-orange-100 bg-orange-50 text-orange-700",
      },
      {
        label: "Resolved",
        value: issues.filter((issue) =>
          ["Fixed", "Closed"].includes(issue.status),
        ).length,
        icon: CheckCircle2,
        style: "border border-emerald-100 bg-emerald-50 text-emerald-700",
      },
    ],
    [issues],
  );

  // -------------------------------------------------------------------------
  // Modal Controls
  // -------------------------------------------------------------------------

  const closeTicketModal = useCallback(() => {
    if (submittingTicket) return;

    setIsTicketModalOpen(false);
    setTicketForm(INITIAL_FORM);
  }, [submittingTicket]);

  // -------------------------------------------------------------------------
  // Submit Ticket
  // -------------------------------------------------------------------------

  const handleRaiseTicket = async (event) => {
    event.preventDefault();

    if (!ticketForm.projectId) {
      showToast.error("Please select a project.");
      return;
    }

    if (!ticketForm.title.trim()) {
      showToast.error("Please enter a ticket title.");
      return;
    }

    setSubmittingTicket(true);

    try {
      await axios.post(
        "/api/bugs/issue-report",
        {
          projectId: ticketForm.projectId,
          title: ticketForm.title.trim(),
          classification: ticketForm.classification,
          severity: ticketForm.severity,
          description: ticketForm.description.trim(),
        },
        { withCredentials: true },
      );

      showToast.success("Your ticket has been submitted successfully.");

      setIsTicketModalOpen(false);
      setTicketForm(INITIAL_FORM);

      await fetchReportedIssues();
    } catch (error) {
      showToast.error(
        getErrorMessage(
          error,
          "Unable to submit your ticket. Please try again.",
        ),
      );
    } finally {
      setSubmittingTicket(false);
    }
  };

  // -------------------------------------------------------------------------
  // Page UI
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-7 pb-8">
      {/* Client Bugs Dashboard Header */}
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
              Reported Issues
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Track reported issues, monitor their status and raise support
              tickets for your projects.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-semibold text-white">
                  Issue tracking
                </p>

                <p className="mt-0.5 text-[11px] text-slate-300">
                  Client support center
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={fetchReportedIssues}
                disabled={loadingIssues}
              >
                <span className="flex items-center gap-2">
                  <RefreshCw
                    size={16}
                    className={loadingIssues ? "animate-spin" : ""}
                  />
                  Refresh
                </span>
              </Button>

              <button
                type="button"
                onClick={() => setIsTicketModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-cm-navy-950 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-[#0b1734]"
              >
                <Plus size={17} />
                Raise a ticket
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Issue Summary */}
      <section>
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cm-text-muted">
            At a glance
          </p>

          <h2 className="mt-1 text-lg font-bold text-cm-navy-950">
            Issue summary
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {summary.map((item) => (
            <SummaryCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      {/* Reported Issues */}
      <section className="overflow-hidden rounded-2xl border border-cm-border bg-cm-card shadow-sm">
        {/* Section Header */}
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <SectionTitle
            eyebrow="Support tracking"
            title="Your reported issues"
            description="Track the status and updates for issues submitted across your projects."
            action={
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-cm-navy-950">
                <Bug className="h-3.5 w-3.5" />
                {issues.length} {issues.length === 1 ? "issue" : "issues"}
              </span>
            }
          />
        </div>

        {/* Loading State */}
        {loadingIssues ? (
          <div className="flex min-h-48 items-center justify-center p-10">
            <Loader />
          </div>
        ) : issues.length === 0 ? (
          /* Empty State */
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-800">
              <FilePlus2 size={25} />
            </div>

            <p className="mt-4 font-semibold text-cm-navy-950">
              No reported issues yet
            </p>

            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-cm-text-muted">
              When you raise a ticket, it will appear here so you can follow
              its progress.
            </p>

            <button
              type="button"
              onClick={() => setIsTicketModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cm-navy-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
            >
              <Plus size={16} />
              Raise your first ticket
            </button>
          </div>
        ) : (
          /* Issue List */
          <div className="divide-y divide-slate-200">
            {issues.map((issue) => (
              <article
                key={issue.uuid || issue.id}
                className="space-y-3 p-4 transition-colors hover:bg-slate-50/80 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-800">
                      {issue.classification === "Change Request" ? (
                        <MessageSquareText size={18} />
                      ) : (
                        <Bug size={18} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words font-semibold text-cm-navy-950">
                          {issue.title || "Untitled issue"}
                        </h3>

                        {issue.classification && (
                          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {issue.classification}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 break-all text-xs text-cm-text-muted">
                        ISSUE-{issue.id} {issue.uuid ? `· ${issue.uuid}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={severityVariant[issue.severity] || "info"}>
                      {issue.severity || "Unspecified"}
                    </Badge>

                    <Badge variant={statusVariant[issue.status] || "secondary"}>
                      {issue.status || "Unknown"}
                    </Badge>
                  </div>
                </div>

                {issue.description && (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600 sm:pl-[52px]">
                    {issue.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-cm-text-muted sm:pl-[52px]">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={13} />
                    Submitted {formatDate(issue.createdAt)}
                  </span>

                  {issue.module?.name && (
                    <span>Module: {issue.module.name}</span>
                  )}
                </div>

                {/* Review Details */}
                {(issue.reviewNotes || issue.reviewedBy != null) && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-sm sm:ml-[52px]">
                    <p className="font-semibold text-cm-navy-950">
                      Review details
                    </p>

                    {issue.reviewedBy != null && (
                      <p className="mt-1 text-slate-600">
                        Reviewed by: {issue.reviewedBy}
                      </p>
                    )}

                    {issue.reviewNotes && (
                      <p className="mt-1 whitespace-pre-wrap text-slate-600">
                        {issue.reviewNotes}
                      </p>
                    )}

                    {issue.reviewedAt && (
                      <p className="mt-1 text-xs text-slate-500">
                        Reviewed on: {formatDate(issue.reviewedAt)}
                      </p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Raise Ticket Modal */}
      {isTicketModalOpen && (
        <Modal onClose={closeTicketModal}>
          {/* Modal Header */}
          <header className="relative isolate shrink-0 overflow-hidden bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-6 text-white sm:px-8">
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

            <div className="relative z-10 flex items-start justify-between gap-5">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100">
                  <FilePlus2 size={22} />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                    CLIENT SUPPORT CENTER
                  </p>

                  <h2
                    id="raise-ticket-title"
                    className="mt-2 text-2xl font-bold tracking-tight text-white"
                  >
                    Raise a ticket
                  </h2>

                  <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-300">
                    Tell us what needs attention. Our team will review your
                    request and follow up.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeTicketModal}
                disabled={submittingTicket}
                aria-label="Close ticket form"
                className="shrink-0 rounded-xl border border-white/15 bg-white/10 p-2.5 text-slate-200 transition hover:border-white/25 hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                Project support
              </span>

              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                Bug · Issue · Change request
              </span>
            </div>
          </header>

          {/* Ticket Form */}
          <form
            onSubmit={handleRaiseTicket}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/80 px-5 py-5 sm:px-8 sm:py-6">
              {/* Form Section */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-800">
                    <FilePlus2 className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-cm-navy-950">
                      Ticket details
                    </p>

                    <p className="mt-1 text-xs leading-5 text-cm-text-muted">
                      Fields marked with{" "}
                      <span className="font-semibold text-rose-600">*</span>{" "}
                      are required.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Project */}
                  <div>
                    <Select
                      label="Project"
                      name="ticketProjectId"
                      value={ticketForm.projectId}
                      options={projectOptions}
                      placeholder={
                        loadingProjects
                          ? "Loading projects..."
                          : "Choose the project this ticket relates to"
                      }
                      disabled={loadingProjects || submittingTicket}
                      onChange={(event) =>
                        setTicketForm((current) => ({
                          ...current,
                          projectId: event.target.value,
                        }))
                      }
                    />

                    <p className="mt-1.5 text-xs text-cm-text-muted">
                      Select the project where you need help.
                    </p>
                  </div>

                  {/* Title */}
                  <Input
                    label="Title"
                    name="title"
                    type="text"
                    value={ticketForm.title}
                    onChange={(event) =>
                      setTicketForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="e.g. Unable to save changes on the dashboard"
                    maxLength={150}
                    required
                    disabled={submittingTicket}
                  />

                  {/* Request Type and Severity */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Select
                      label="Request type"
                      name="classification"
                      value={ticketForm.classification}
                      options={REQUEST_TYPE_OPTIONS}
                      disabled={submittingTicket}
                      onChange={(event) =>
                        setTicketForm((current) => ({
                          ...current,
                          classification: event.target.value,
                        }))
                      }
                    />

                    <Select
                      label="Severity"
                      name="severity"
                      value={ticketForm.severity}
                      options={SEVERITY_OPTIONS}
                      disabled={submittingTicket}
                      onChange={(event) =>
                        setTicketForm((current) => ({
                          ...current,
                          severity: event.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="ticket-description"
                      className="mb-2 block text-sm font-semibold text-cm-text"
                    >
                      Description{" "}
                      <span className="font-normal text-cm-text-muted">
                        (optional)
                      </span>
                    </label>

                    <textarea
                      id="ticket-description"
                      name="description"
                      rows={5}
                      maxLength={5000}
                      value={ticketForm.description}
                      onChange={(event) =>
                        setTicketForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      disabled={submittingTicket}
                      placeholder="Share the steps, expected result, or any details that will help us understand your request..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-xs text-cm-text-muted">
                        More context helps us resolve your request faster.
                      </span>

                      <span className="shrink-0 text-xs tabular-nums text-cm-text-muted">
                        {ticketForm.description.length}/5000
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Submission Information */}
              <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3.5">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-blue-800"
                />

                <div>
                  <p className="text-sm font-semibold text-cm-navy-950">
                    Before you submit
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Project and title are required. Request type and severity
                    are preselected, and you can add an optional description.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <p className="text-xs text-cm-text-muted">
                Your request will be added to your reported issues.
              </p>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={closeTicketModal}
                  disabled={submittingTicket}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submittingTicket ||
                    loadingProjects ||
                    !ticketForm.projectId ||
                    !ticketForm.title.trim()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cm-navy-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/15 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {submittingTicket ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit ticket
                    </>
                  )}
                </button>
              </div>
            </footer>
          </form>
        </Modal>
      )}
    </div>
  );
}
