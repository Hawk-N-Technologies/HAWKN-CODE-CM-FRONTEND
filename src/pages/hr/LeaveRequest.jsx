
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

function ModalHeader({ onClose, submitting }) {
  return (
    <div className="relative overflow-hidden rounded-t-[20px] bg-gradient-to-br from-[#080d2b] via-[#0b1538] to-[#171c50] px-6 py-6 text-white">
      <div className="pointer-events-none absolute -right-8 -top-16 h-44 w-44 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-1 -top-8 h-28 w-28 rounded-full border border-blue-300/10" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100">
              Leave Management
            </span>
          </div>

          <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
            Apply for Leave
          </h2>

          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-300">
            Submit your leave request for HR review and approval.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close leave application"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] text-lg text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ×
        </button>
      </div>
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
   * FETCH MY LEAVES
   *
   * PENDING:
   * PENDING + leaveDate >= today
   *
   * HISTORY:
   * APPROVED
   * REJECTED
   * PENDING + leaveDate < today
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

      setLeaves(
        Array.isArray(response.data?.data) ? response.data.data : [],
      );
    } catch (error) {
      console.error("Failed to fetch leaves:", error);

      setLeaves([]);

      showToast.error(
        error.response?.data?.message ||
          "Failed to fetch your leave records.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // Close the application modal with Escape.
  useEffect(() => {
    if (!showForm) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) {
        closeForm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm, submitting]);

  /**
   * FORM CHANGE
   */
  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /**
   * RESET FORM
   */
  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
  };

  /**
   * CLOSE FORM
   */
  const closeForm = () => {
    if (submitting) return;

    resetForm();
    setShowForm(false);
  };

  /**
   * CREATE LEAVE REQUEST
   */
  const submitLeave = async (event) => {
    event.preventDefault();

    if (submitting) return;

    if (!form.leaveDate) {
      showToast.error("Leave date is required.");
      return;
    }

    const todayDate = getTodayDate();

    if (form.leaveDate < todayDate) {
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
   * SEARCH
   */
  const filteredLeaves = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return leaves;

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
   * TABLE COLUMNS
   */
  const columns = [
    {
      key: "leaveDate",
      header: "Date",
      render: (row) => (
        <span className="whitespace-nowrap font-medium text-slate-800">
          {formatDate(row.leaveDate)}
        </span>
      ),
    },
    {
      key: "leaveType",
      header: "Leave Type",
      render: (row) => (
        <span className="font-medium text-slate-800">
          {getLeaveTypeLabel(row.leaveType)}
        </span>
      ),
    },
    {
      key: "leaveSession",
      header: "Session",
      render: (row) => (
        <span className="text-slate-600">
          {getSessionLabel(row.leaveSession)}
        </span>
      ),
    },
    {
      key: "isPaid",
      header: "Paid",
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
        <span className="text-slate-500">{row.reason || "—"}</span>
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

  return (
    <div className="flex flex-col gap-6">
      {/* MY LEAVE PAGE HEADER */}
      <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#080d2b] via-[#0b1538] to-[#171c50] px-5 py-6 text-white shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/[0.07]" />
        <div className="pointer-events-none absolute -right-2 -top-12 h-44 w-44 rounded-full border border-blue-300/[0.09]" />
        <div className="pointer-events-none absolute bottom-[-100px] right-[28%] h-64 w-64 rounded-full bg-cyan-500/[0.08] blur-3xl" />

        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5">
              <span className="text-sm">✧</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-200">
                Personal Workspace
              </span>
            </div>

            <h1 className="mt-4 text-[27px] font-bold tracking-tight text-white sm:text-[32px]">
              My Leave
            </h1>

            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-slate-300 sm:text-sm">
              Manage your time off, submit leave requests and review your leave
              history, all in one place.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Leave applications
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                HR approval tracking
              </span>
            </div>
          </div>

          <div className="relative flex flex-wrap items-center gap-3">
            <div className="min-w-[130px] rounded-[14px] border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm">
              <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-slate-400">
                Selected View
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {activeTab === "PENDING" ? "Pending Requests" : "Leave History"}
              </p>
            </div>

            <Button
              onClick={() => setShowForm(true)}
              disabled={submitting}
            >
              Apply Leave
            </Button>
          </div>
        </div>
      </section>

      {/* LEAVE APPLICATION MODAL */}
      {showForm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-modal-title"
            className="my-auto w-full max-w-2xl overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <ModalHeader
              onClose={closeForm}
              submitting={submitting}
            />

            <form onSubmit={submitLeave} className="p-5 sm:p-6">
              <div className="mb-5">
                <h3
                  id="leave-modal-title"
                  className="text-sm font-bold text-[#101b32]"
                >
                  Leave Details
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Complete the information below to submit your application.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Input
                  label="Leave Date"
                  type="date"
                  required
                  min={getTodayDate()}
                  value={form.leaveDate}
                  onChange={(event) =>
                    handleChange("leaveDate", event.target.value)
                  }
                />

                <Select
                  label="Leave Type"
                  value={form.leaveType}
                  options={LEAVE_TYPE_OPTIONS}
                  onChange={(event) =>
                    handleChange("leaveType", event.target.value)
                  }
                />

                <Select
                  label="Session"
                  value={form.leaveSession}
                  options={SESSION_OPTIONS}
                  onChange={(event) =>
                    handleChange("leaveSession", event.target.value)
                  }
                />

                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                  <p className="text-xs font-semibold text-blue-900">
                    Application information
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-blue-800/80">
                    Your leave request will be submitted for HR approval.
                    Approval and paid/unpaid status are determined separately.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Reason"
                    placeholder="Enter reason for leave"
                    value={form.reason}
                    onChange={(event) =>
                      handleChange("reason", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={closeForm}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={submitting} loading={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEAVE REQUEST TABS */}
      <section className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#101b32]">
              Leave Management
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Switch between upcoming requests and your leave history.
            </p>
          </div>

          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("PENDING");
                setSearch("");
              }}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 ${
                activeTab === "PENDING"
                  ? "bg-[#101b32] text-white shadow-sm"
                  : "text-slate-500 hover:bg-white hover:text-slate-800"
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
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 ${
                activeTab === "HISTORY"
                  ? "bg-[#101b32] text-white shadow-sm"
                  : "text-slate-500 hover:bg-white hover:text-slate-800"
              }`}
            >
              Leave History
            </button>
          </div>
        </div>
      </section>

      {/* LEAVE RECORDS */}
      <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-[#101b32]">
              {activeTab === "PENDING"
                ? "Pending Leave Requests"
                : "Leave History"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredLeaves.length} leave
              {filteredLeaves.length === 1 ? "" : "s"} found
            </p>
          </div>

          <Badge tone={filteredLeaves.length > 0 ? "success" : "neutral"}>
            {filteredLeaves.length} Leaves
          </Badge>
        </div>

        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <TableSearch
            value={search}
            onChange={setSearch}
            placeholder="Search leave type, date, status..."
          />
        </div>

        <div className="p-4 sm:p-5">
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
