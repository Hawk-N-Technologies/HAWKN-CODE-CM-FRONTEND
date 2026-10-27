import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CalendarRange, X } from "lucide-react";

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
  if (!value) {
    return "—";
  }

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

  /**
   * -------------------------------------------------------
   * FETCH MY LEAVES
   * -------------------------------------------------------
   *
   * PENDING:
   *   PENDING + leaveDate >= today
   *
   * HISTORY:
   *   APPROVED
   *   REJECTED
   *   PENDING + leaveDate < today
   */
  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get("/api/leave", {
        params: {
          tab: activeTab,
        },
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

  /**
   * -------------------------------------------------------
   * FETCH WHEN TAB CHANGES
   * -------------------------------------------------------
   */
  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  /**
   * -------------------------------------------------------
   * FORM CHANGE
   * -------------------------------------------------------
   */
  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /**
   * -------------------------------------------------------
   * RESET FORM
   * -------------------------------------------------------
   */
  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
    });
  };

  /**
   * -------------------------------------------------------
   * CLOSE FORM
   * -------------------------------------------------------
   */
  const closeForm = () => {
    if (submitting) {
      return;
    }

    resetForm();
    setShowForm(false);
  };

  /**
   * -------------------------------------------------------
   * CREATE LEAVE REQUEST
   * -------------------------------------------------------
   */
  const submitLeave = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    /**
     * Required date.
     */
    if (!form.leaveDate) {
      showToast.error("Leave date is required.");
      return;
    }

    /**
     * Employee cannot apply for a past date.
     */
    const todayDate = getTodayDate();

    if (form.leaveDate < todayDate) {
      showToast.error("Leave date cannot be in the past.");
      return;
    }

    /**
     * Required leave type.
     */
    if (!form.leaveType) {
      showToast.error("Leave type is required.");
      return;
    }

    /**
     * Required session.
     */
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
        {
          withCredentials: true,
        },
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

  /**
   * -------------------------------------------------------
   * SEARCH
   * -------------------------------------------------------
   */
  const filteredLeaves = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return leaves;
    }

    return leaves.filter((row) => {
      return (
        row.leaveType?.toLowerCase().includes(query) ||
        row.leaveStatus?.toLowerCase().includes(query) ||
        row.leaveDate?.toLowerCase().includes(query) ||
        row.leaveSession?.toLowerCase().includes(query) ||
        row.reason?.toLowerCase().includes(query)
      );
    });
  }, [leaves, search]);

  /**
   * -------------------------------------------------------
   * TABLE COLUMNS
   * -------------------------------------------------------
   */
  const columns = [
    {
      key: "leaveDate",
      header: "Date",

      render: (row) => (
        <span className="whitespace-nowrap font-medium text-cm-text">
          {formatDate(row.leaveDate)}
        </span>
      ),
    },

    {
      key: "leaveType",
      header: "Leave Type",

      render: (row) => (
        <span className="font-medium text-cm-text">
          {getLeaveTypeLabel(row.leaveType)}
        </span>
      ),
    },

    {
      key: "leaveSession",
      header: "Session",

      render: (row) => <span>{getSessionLabel(row.leaveSession)}</span>,
    },

    {
      key: "isPaid",
      header: "Paid",

      render: (row) => {
        /**
         * isPaid is NULL while pending.
         */
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
        <span className="text-cm-text-muted">{row.reason || "—"}</span>
      ),
    },

    {
      key: "leaveStatus",
      header: "Status",

      render: (row) => (
        <Badge tone={STATUS_TONE[row.leaveStatus] || "neutral"}>
          {row.leaveStatus || "—"}
        </Badge>
      ),
    },
  ];

  /**
   * -------------------------------------------------------
   * UI
   * -------------------------------------------------------
   */
  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">My Leave</h1>

          <p className="mt-1 text-sm text-cm-text-muted">
            Submit leave requests and view your leave history.
          </p>
        </div>

        <Button
          onClick={() => {
            setShowForm((value) => !value);
          }}
          disabled={submitting}
        >
          {showForm ? "Close" : "Apply Leave"}
        </Button>
      </div>

      {/* APPLY LEAVE FORM */}
      {showForm && (
        <LeaveRequestModal
          title="Apply for Leave"
          subtitle="Submit a leave request for review"
          onClose={closeForm}
          dismissDisabled={submitting}
        >
          <form
            onSubmit={submitLeave}
            className="grid grid-cols-1 gap-4 p-5 sm:p-7 md:grid-cols-3"
          >

          {/* DATE */}
          <Input
            label="Leave Date"
            type="date"
            required
            min={getTodayDate()}
            value={form.leaveDate}
            onChange={(event) => {
              handleChange("leaveDate", event.target.value);
            }}
          />

          {/* LEAVE TYPE */}
          <Select
            label="Leave Type"
            value={form.leaveType}
            options={LEAVE_TYPE_OPTIONS}
            onChange={(event) => {
              handleChange("leaveType", event.target.value);
            }}
          />

          {/* SESSION */}
          <Select
            label="Session"
            value={form.leaveSession}
            options={SESSION_OPTIONS}
            onChange={(event) => {
              handleChange("leaveSession", event.target.value);
            }}
          />

          {/* REASON */}
          <div className="md:col-span-3">
            <Input
              label="Reason"
              placeholder="Enter reason for leave"
              value={form.reason}
              onChange={(event) => {
                handleChange("reason", event.target.value);
              }}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col-reverse gap-3 rounded-xl border-t border-cm-border bg-slate-50 p-4 sm:flex-row sm:justify-end md:col-span-3">
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
        </LeaveRequestModal>
      )}

      {/* TABS */}
      <div className="flex gap-6 border-b border-cm-border">
        <button
          type="button"
          onClick={() => {
            setActiveTab("PENDING");
            setSearch("");
          }}
          className={`border-b-2 px-1 pb-3 text-sm font-medium ${
            activeTab === "PENDING"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-cm-text-muted"
          }`}
        >
          Pending Requests
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("HISTORY");
            setSearch("");
          }}
          className={`border-b-2 px-1 pb-3 text-sm font-medium ${
            activeTab === "HISTORY"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-cm-text-muted"
          }`}
        >
          Leave History
        </button>
      </div>

      {/* SEARCH */}
      <TableSearch
        value={search}
        onChange={setSearch}
        placeholder="Search leave type, date, status..."
      />

      {/* TABLE */}
      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-cm-text">
              {activeTab === "PENDING"
                ? "Pending Leave Requests"
                : "Leave History"}
            </h2>

            <p className="mt-1 text-xs text-cm-text-muted">
              {filteredLeaves.length} leave
              {filteredLeaves.length === 1 ? "" : "s"} found
            </p>
          </div>

          <Badge tone={filteredLeaves.length > 0 ? "success" : "neutral"}>
            {filteredLeaves.length} Leaves
          </Badge>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
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
    </div>
  );
};

export default LeaveRequest;
