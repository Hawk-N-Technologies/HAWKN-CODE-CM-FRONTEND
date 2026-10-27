import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Loader from "../../components/common/Loader";
import { showToast } from "../../components/common/Toast";

const STATUS_TONE = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

const LEAVE_TYPE_OPTIONS = [
  { value: "CASUAL", label: "Casual Leave" },
  { value: "SICK", label: "Sick Leave" },
  { value: "ANNUAL", label: "Annual Leave" },
  { value: "UNPAID", label: "Unpaid Leave" },
  { value: "OTHER", label: "Other" },
];

const SESSION_OPTIONS = [
  { value: "FULL_DAY", label: "Full Day" },
  { value: "FIRST_HALF", label: "First Half" },
  { value: "SECOND_HALF", label: "Second Half" },
];

const EMPTY_FORM = {
  leaveDate: "",
  leaveType: "CASUAL",
  leaveSession: "FULL_DAY",
  reason: "",
};

function formatDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getSessionLabel(session) {
  switch (session) {
    case "FULL_DAY":
      return "Full Day";
    case "FIRST_HALF":
      return "First Half";
    case "SECOND_HALF":
      return "Second Half";
    default:
      return session || "—";
  }
}

function getLeaveTypeLabel(type) {
  const option = LEAVE_TYPE_OPTIONS.find((item) => item.value === type);
  return option?.label || type || "—";
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function LeaveRequestModal({
  title,
  subtitle,
  onClose,
  dismissDisabled = false,
  children,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !dismissDisabled) onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dismissDisabled, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !dismissDisabled) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-request-modal-title"
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
      >
        <header className="relative isolate shrink-0 overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#0b1833] via-[#122b4d] to-[#1c4168] px-5 py-5 text-white sm:px-7">
          <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute -right-1 -top-10 h-36 w-36 rounded-full border border-white/[0.07]" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white shadow-sm">
                <CalendarRange size={19} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="leave-request-modal-title"
                    className="text-lg font-semibold tracking-tight text-white sm:text-xl"
                  >
                    {title}
                  </h2>
                  <span className="rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-200">
                    LEAVE REQUEST
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-300">
                  {subtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close leave request dialog"
              onClick={onClose}
              disabled={dismissDisabled}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white/20 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={17} />
            </button>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-sky-300" />
            <span>Leave operations</span>
            <span className="text-slate-500">/</span>
            <span>Employee leave request details</span>
          </div>
        </header>
        <div className="overflow-y-auto bg-white">{children}</div>
      </section>
    </div>
  );
}

const LeaveRequest = () => {
  const [leaves, setLeaves] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("PENDING");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/leave", {
        params: { tab: activeTab },
        withCredentials: true,
      });
      setLeaves(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
      setLeaves([]);
      showToast.error(
        error.response?.data?.message || "Failed to fetch your leave records.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const resetForm = () => setForm({ ...EMPTY_FORM });

  const openAddModal = () => {
    resetForm();
    setShowForm(true);
  };

  const closeForm = () => {
    if (submitting) return;
    resetForm();
    setShowForm(false);
  };

  useEffect(() => {
    if (!showForm) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) closeForm();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm, submitting]);

  const submitLeave = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (!form.leaveDate) {
      showToast.error("Leave date is required.");
      return;
    }

    if (form.leaveDate < getTodayDate()) {
      showToast.error("Leave date cannot be in the past.");
      return;
    }

    if (!form.leaveType) {
      showToast.error("Leave type is required.");
      return;
    }

    if (!form.leaveSession) {
      showToast.error("Leave session is required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        leave_date: form.leaveDate,
        leave_type: form.leaveType,
        leave_session: form.leaveSession,
        reason: form.reason.trim() || null,
      };

      const response = await axios.post("/api/leave", payload, {
        withCredentials: true,
      });

      if (
        response.status === 201 ||
        response.status === 200 ||
        response.status === 204
      ) {
        showToast.success(
          response.data?.message || "Leave request submitted successfully.",
        );
        resetForm();
        setShowForm(false);
        await fetchLeaves();
      }
    } catch (error) {
      console.error("Failed to submit leave:", error);
      showToast.error(
        error.response?.data?.message || "Failed to submit leave request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLeaves = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return leaves;

    return leaves.filter(
      (row) =>
        row.leaveType?.toLowerCase().includes(query) ||
        row.leaveStatus?.toLowerCase().includes(query) ||
        row.leaveDate?.toLowerCase().includes(query) ||
        row.leaveSession?.toLowerCase().includes(query) ||
        row.reason?.toLowerCase().includes(query),
    );
  }, [leaves, search]);

  const columns = [
    {
      key: "leaveDate",
      header: "Leave date",
      render: (row) => (
        <div className="min-w-[112px]">
          <p className="whitespace-nowrap text-sm font-semibold text-cm-text">
            {formatDate(row.leaveDate)}
          </p>
          <p className="mt-0.5 text-[11px] text-cm-text-muted">
            {row.leaveDate || "Date not available"}
          </p>
        </div>
      ),
    },
    {
      key: "leaveType",
      header: "Leave type",
      render: (row) => (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-cm-text">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
          {getLeaveTypeLabel(row.leaveType)}
        </span>
      ),
    },
    {
      key: "leaveSession",
      header: "Duration",
      render: (row) => (
        <span className="inline-flex whitespace-nowrap border border-cm-border px-2.5 py-1 text-xs font-medium text-cm-text-muted">
          {getSessionLabel(row.leaveSession)}
        </span>
      ),
    },
    {
      key: "isPaid",
      header: "Payment",
      render: (row) => {
        if (row.isPaid === null || row.isPaid === undefined) {
          return <Badge tone="neutral">Not Decided</Badge>;
        }
        return (
          <Badge tone={row.isPaid ? "success" : "warning"}>
            {row.isPaid ? "Paid" : "Unpaid"}
          </Badge>
        );
      },
    },
    {
      key: "reason",
      header: "Reason",
      render: (row) => (
        <span
          className="block max-w-[240px] truncate text-sm text-cm-text-muted"
          title={row.reason || ""}
        >
          {row.reason || "No reason provided"}
        </span>
      ),
    },
    {
      key: "leaveStatus",
      header: "Request status",
      render: (row) => (
        <Badge tone={STATUS_TONE[row.leaveStatus] || "neutral"}>
          {row.leaveStatus || "—"}
        </Badge>
      ),
    },
  ];

  const pendingCount = leaves.filter(
    (leave) => leave.leaveStatus === "PENDING",
  ).length;

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-5 pb-8 sm:gap-7">
      {/* Page heading */}
      <header className="flex min-w-0 flex-col gap-4 border-b border-cm-border pb-5 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cm-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Employee self-service
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-cm-text sm:text-3xl">
            Leave requests
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-cm-text-muted">
            Plan time away, submit a request, and keep track of every decision.
          </p>
        </div>

        <Button
          onClick={openAddModal}
          disabled={submitting}
          className="w-full shrink-0 sm:w-auto"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Plus size={16} />
            Apply for leave
          </span>
        </Button>
      </header>

      {/* Add leave modal */}
      {showForm && (
        <form
          onSubmit={submitLeave}
          className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm md:grid-cols-3"
        >
          <div className="md:col-span-3">
            <div>
              <h2 className="text-sm font-semibold text-cm-text">
                Apply for Leave
              </h2>

              <p className="mt-1 text-xs text-cm-text-muted">
                Submit your leave request for HR approval.
              </p>
            </div>
          </div>

            <form onSubmit={submitLeave} className="min-h-0 overflow-y-auto">
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="leave-date"
                    className="mb-2 block text-sm font-medium text-cm-text"
                  >
                    Leave date <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    id="leave-date"
                    label=""
                    type="date"
                    required
                    min={getTodayDate()}
                    value={form.leaveDate}
                    onChange={(event) =>
                      handleChange("leaveDate", event.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-cm-text">
                    Leave type <span className="text-rose-600">*</span>
                  </label>
                  <Select
                    label=""
                    value={form.leaveType}
                    options={LEAVE_TYPE_OPTIONS}
                    onChange={(event) =>
                      handleChange("leaveType", event.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-cm-text">
                    Duration <span className="text-rose-600">*</span>
                  </label>
                  <Select
                    label=""
                    value={form.leaveSession}
                    options={SESSION_OPTIONS}
                    onChange={(event) =>
                      handleChange("leaveSession", event.target.value)
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="leave-reason"
                    className="mb-2 block text-sm font-medium text-cm-text"
                  >
                    Reason{" "}
                    <span className="font-normal text-cm-text-muted">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="leave-reason"
                    rows={4}
                    maxLength={1000}
                    value={form.reason}
                    onChange={(event) =>
                      handleChange("reason", event.target.value)
                    }
                    placeholder="Briefly explain why you need leave…"
                    className="w-full resize-y rounded-lg border border-cm-border bg-cm-card px-3.5 py-3 text-sm text-cm-text outline-none transition placeholder:text-cm-text-muted/70 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                  <p className="mt-1.5 text-right text-xs text-cm-text-muted">
                    {form.reason.length}/1000 characters
                  </p>
                </div>
              </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 md:col-span-3">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={closeForm}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      )}

      {/* Views */}
      <section className="min-w-0">
        <div className="flex min-w-0 flex-col gap-4 border-b border-cm-border sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 gap-5 sm:gap-7">
            <button
              type="button"
              onClick={() => {
                setActiveTab("PENDING");
                setSearch("");
              }}
              className={`relative -mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-0.5 text-sm font-semibold transition-colors ${
                activeTab === "PENDING"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-cm-text-muted hover:text-cm-text"
              }`}
              aria-current={activeTab === "PENDING" ? "page" : undefined}
            >
              <FileClock size={16} />
              <span>Pending</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("HISTORY");
                setSearch("");
              }}
              className={`relative -mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-0.5 text-sm font-semibold transition-colors ${
                activeTab === "HISTORY"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-cm-text-muted hover:text-cm-text"
              }`}
              aria-current={activeTab === "HISTORY" ? "page" : undefined}
            >
              <History size={16} />
              <span>History</span>
            </button>
          </div>
          <div className="pb-3 text-xs text-cm-text-muted">
            {activeTab === "PENDING"
              ? "Requests awaiting or in progress"
              : "Previously decided and past requests"}
          </div>
        </div>

        {/* Table section */}
        <section className="mt-4 min-w-0 border border-cm-border bg-cm-card">
          <div className="flex min-w-0 flex-col gap-4 border-b border-cm-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight text-cm-text">
                {activeTab === "PENDING"
                  ? "Pending leave requests"
                  : "Leave history"}
              </h2>
              <p className="mt-1 text-xs text-cm-text-muted">
                {filteredLeaves.length}{" "}
                {filteredLeaves.length === 1 ? "request" : "requests"} found
                {activeTab === "PENDING" && pendingCount > 0
                  ? ` · ${pendingCount} pending`
                  : ""}
              </p>
            </div>
            <div className="w-full min-w-0 sm:max-w-sm">
              <TableSearch
                value={search}
                onChange={setSearch}
                placeholder="Search type, date, status…"
              />
            </div>
          </div>

          <div className="min-w-0">
            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <Loader />
              </div>
            ) : (
              <DataTable
                columns={columns}
                rows={filteredLeaves}
                emptyMessage={
                  activeTab === "PENDING"
                    ? "No pending leave requests."
                    : "No leave history found."
                }
              />
            )}
          </div>
        </section>
      </section>

      <footer className="flex items-start gap-2 border-t border-cm-border pt-4 text-xs leading-5 text-cm-text-muted">
        <CalendarDays size={15} className="mt-0.5 shrink-0" />
        <p>
          Leave requests are subject to company policy and HR approval. Check
          the status column for the latest decision.
        </p>
      </footer>
    </main>
  );
};

export default LeaveRequest;
