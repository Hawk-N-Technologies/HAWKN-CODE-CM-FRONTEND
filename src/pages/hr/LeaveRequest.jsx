import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarDays,
  CalendarCheck2,
  CalendarX2,
  Clock3,
  Search,
  Plus,
  X,
  FileClock,
  History,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";

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

  const closeForm = () => {
    if (submitting) return;
    resetForm();
    setShowForm(false);
  };

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
      const response = await axios.post(
        "/api/leave",
        {
          leave_date: form.leaveDate,
          leave_type: form.leaveType,
          leave_session: form.leaveSession,
          reason: form.reason.trim() || null,
        },
        { withCredentials: true },
      );

      if (response.status === 201 || response.status === 200) {
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
          onClick={() => setShowForm((value) => !value)}
          disabled={submitting}
          className="w-full shrink-0 sm:w-auto"
        >
          <span className="inline-flex items-center justify-center gap-2">
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Close form" : "Apply for leave"}
          </span>
        </Button>
      </header>

      {/* Apply form */}
      {showForm && (
        <section className="border border-cm-border bg-cm-card">
          <div className="flex flex-col gap-3 border-b border-cm-border bg-cm-bg/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-indigo-50 text-indigo-700">
                <CalendarCheck2 size={19} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-cm-text">
                  New leave request
                </h2>
                <p className="mt-1 text-xs leading-5 text-cm-text-muted">
                  Complete the details below for HR review.
                </p>
              </div>
            </div>
            <span className="text-xs text-cm-text-muted">
              Fields marked required must be completed.
            </span>
          </div>

          <form
            onSubmit={submitLeave}
            className="grid grid-cols-1 gap-x-5 gap-y-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3"
          >
            <Input
              label="Leave date"
              type="date"
              required
              min={getTodayDate()}
              value={form.leaveDate}
              onChange={(event) =>
                handleChange("leaveDate", event.target.value)
              }
            />
            <Select
              label="Leave type"
              value={form.leaveType}
              options={LEAVE_TYPE_OPTIONS}
              onChange={(event) =>
                handleChange("leaveType", event.target.value)
              }
            />
            <Select
              label="Duration"
              value={form.leaveSession}
              options={SESSION_OPTIONS}
              onChange={(event) =>
                handleChange("leaveSession", event.target.value)
              }
            />

            <div className="sm:col-span-2 lg:col-span-3">
              <Input
                label="Reason (optional)"
                placeholder="Briefly explain the reason for your leave"
                value={form.reason}
                onChange={(event) => handleChange("reason", event.target.value)}
              />
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-cm-border pt-4 sm:col-span-2 sm:flex-row sm:justify-end lg:col-span-3">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={closeForm}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw size={15} className="animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 size={15} />
                    Submit request
                  </span>
                )}
              </Button>
            </div>
          </form>
        </section>
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
