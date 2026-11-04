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
  X,
} from "lucide-react";

import Select from "../../components/common/Select";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Badge from "../../components/common/Badge";
import { showToast } from "../../components/common/Toast";

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-cm-navy-950/65 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="raise-ticket-title"
        className="flex max-h-[min(92vh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-cm-card shadow-[0_30px_100px_-25px_rgba(2,6,23,0.55)]"
      >
        {children}
      </div>
    </div>
  );
}

export default function Bugs() {
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState(INITIAL_FORM);
  const [submittingTicket, setSubmittingTicket] = useState(false);

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

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: String(project.uuid),
        label: project.name || project.projectName || `Project ${project.id}`,
      })),
    [projects],
  );

  const summary = useMemo(
    () => [
      {
        label: "Total issues",
        value: issues.length,
        icon: Bug,
        style: "bg-cm-navy-950/10 text-cm-navy-950",
      },
      {
        label: "Submitted",
        value: issues.filter((issue) => issue.status === "Submitted").length,
        icon: AlertCircle,
        style: "bg-amber-50 text-amber-700",
      },
      {
        label: "In progress",
        value: issues.filter((issue) => issue.status === "In Progress").length,
        icon: Clock3,
        style: "bg-orange-50 text-orange-700",
      },
      {
        label: "Resolved",
        value: issues.filter((issue) =>
          ["Fixed", "Closed"].includes(issue.status),
        ).length,
        icon: CheckCircle2,
        style: "bg-emerald-50 text-emerald-700",
      },
    ],
    [issues],
  );

  const closeTicketModal = useCallback(() => {
    if (submittingTicket) return;
    setIsTicketModalOpen(false);
    setTicketForm(INITIAL_FORM);
  }, [submittingTicket]);

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

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-2xl bg-cm-navy-950 px-5 py-6 text-white shadow-lg sm:px-7">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[32px] border-white/5" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Reported Issues
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
              View your reported issues and raise a ticket for a project.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-cm-navy-950 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-cm-navy-950"
            >
              <Plus size={17} />
              Raise a ticket
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summary.map(({ label, value, icon: Icon, style }) => (
          <div
            key={label}
            className="rounded-2xl border border-cm-border bg-cm-card p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-cm-text-muted sm:text-sm">
                {label}
              </p>
              <span className={`rounded-xl p-2 ${style}`}>
                <Icon size={18} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-cm-text sm:text-3xl">
              {value}
            </p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-cm-border bg-cm-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cm-border p-4 sm:p-5">
          <div>
            <h2 className="font-semibold text-cm-text">Your reported issues</h2>
            <p className="mt-1 text-xs text-cm-text-muted sm:text-sm">
              Track the status and updates for issues submitted across your
              projects.
            </p>
          </div>
          <span className="rounded-full bg-cm-bg px-3 py-1.5 text-xs font-semibold text-cm-text-muted">
            {issues.length} {issues.length === 1 ? "issue" : "issues"}
          </span>
        </div>

        {loadingIssues ? (
          <div className="flex min-h-48 items-center justify-center p-10">
            <Loader />
          </div>
        ) : issues.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cm-navy-950/10 text-cm-navy-950">
              <FilePlus2 size={25} />
            </div>
            <p className="mt-4 font-semibold text-cm-text">
              No reported issues yet
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-cm-text-muted">
              When you raise a ticket, it will appear here so you can follow its
              progress.
            </p>
            <button
              type="button"
              onClick={() => setIsTicketModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cm-navy-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cm-navy-900"
            >
              <Plus size={16} />
              Raise your first ticket
            </button>
          </div>
        ) : (
          <div className="divide-y divide-cm-border">
            {issues.map((issue) => (
              <article
                key={issue.uuid || issue.id}
                className="space-y-3 p-4 transition-colors hover:bg-cm-bg/40 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cm-navy-950/10 text-cm-navy-950">
                      {issue.classification === "Change Request" ? (
                        <MessageSquareText size={18} />
                      ) : (
                        <Bug size={18} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-cm-text">
                          {issue.title || "Untitled issue"}
                        </h3>
                        {issue.classification && (
                          <span className="rounded-md bg-cm-bg px-2 py-0.5 text-[11px] font-medium text-cm-text-muted">
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
                  <p className="whitespace-pre-wrap text-sm leading-6 text-cm-text-muted sm:pl-[52px]">
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

                {(issue.reviewNotes || issue.reviewedBy != null) && (
                  <div className="rounded-xl border border-cm-border bg-cm-bg p-3 text-sm sm:ml-[52px]">
                    <p className="font-semibold text-cm-text">Review details</p>
                    {issue.reviewedBy != null && (
                      <p className="mt-1 text-cm-text-muted">
                        Reviewed by: {issue.reviewedBy}
                      </p>
                    )}
                    {issue.reviewNotes && (
                      <p className="mt-1 whitespace-pre-wrap text-cm-text-muted">
                        {issue.reviewNotes}
                      </p>
                    )}
                    {issue.reviewedAt && (
                      <p className="mt-1 text-xs text-cm-text-muted">
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

      {isTicketModalOpen && (
        <Modal onClose={closeTicketModal}>
          <div className="relative shrink-0 overflow-hidden bg-cm-navy-950 px-6 py-6 text-white sm:px-8">
            <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full border-[28px] border-white/[0.06]" />
            <div className="pointer-events-none absolute -bottom-24 right-28 h-40 w-40 rounded-full bg-white/[0.04] blur-2xl" />

            <div className="relative flex items-start justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner">
                  <FilePlus2 size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                    Support center
                  </p>
                  <h2
                    id="raise-ticket-title"
                    className="mt-1 text-2xl font-bold tracking-tight"
                  >
                    Raise a ticket
                  </h2>
                  <p className="mt-1.5 max-w-md text-sm leading-6 text-white/70">
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
                className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative mt-5 flex flex-wrap items-center gap-2 text-xs text-white/65">
              <span className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5">
                Project support
              </span>
              <span className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5">
                Bug · Issue · Change request
              </span>
            </div>
          </div>

          <form
            onSubmit={handleRaiseTicket}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-cm-bg/45 px-6 py-6 sm:px-8">
              <section className="rounded-2xl border border-cm-border bg-cm-card p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <p className="text-sm font-semibold text-cm-text">
                    Ticket details
                  </p>
                  <p className="mt-1 text-xs leading-5 text-cm-text-muted">
                    Fields marked with{" "}
                    <span className="font-semibold text-rose-600">*</span> are
                    required.
                  </p>
                </div>

                <div className="space-y-5">
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
                      className="w-full resize-y rounded-xl border border-cm-border bg-cm-card px-4 py-3 text-sm leading-6 text-cm-text shadow-sm outline-none transition placeholder:text-cm-text-muted/70 hover:border-cm-navy-950/30 focus:border-cm-navy-950 focus:ring-4 focus:ring-cm-navy-950/10 disabled:cursor-not-allowed disabled:opacity-60"
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

              <div className="flex items-start gap-3 rounded-2xl border border-cm-navy-950/10 bg-cm-navy-950/[0.04] px-4 py-3.5">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-cm-navy-950"
                />
                <div>
                  <p className="text-sm font-semibold text-cm-text">
                    Before you submit
                  </p>
                  <p className="mt-1 text-xs leading-5 text-cm-text-muted">
                    Project and title are required. Request type and severity
                    are preselected, and you can add an optional description.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-cm-border bg-cm-card px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <p className="text-xs text-cm-text-muted">
                Your request will be added to your reported issues.
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={closeTicketModal}
                  disabled={submittingTicket}
                  className="rounded-xl border border-cm-border bg-cm-card px-5 py-2.5 text-sm font-semibold text-cm-text transition hover:bg-cm-bg disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cm-navy-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cm-navy-900 focus:outline-none focus:ring-4 focus:ring-cm-navy-950/15 disabled:cursor-not-allowed disabled:opacity-45"
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
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
