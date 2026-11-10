import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
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

const LeaveLOP = () => {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("PENDING");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Sorting
  const [sortBy, setSortBy] = useState("leaveDate");
  const [sortOrder, setSortOrder] = useState("DESC");

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [editingLeave, setEditingLeave] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [form, setForm] = useState({
    employee: "",
    type: "CASUAL",
    from: "",
    to: "",
    session: "FULL_DAY",
    isPaid: true,
    reason: "",
  });

  // Fetch leaves with server-side pagination, search and sorting
  const fetchLeaves = async () => {
    try {
      setLoading(true);

      const response = await axios.get("/api/leave/leaves", {
        params: {
          status: activeTab,
          search: search.trim() || undefined,
          page,
          limit,
          sortBy,
          sortOrder,
        },
        withCredentials: true,
      });

      setRequests(response.data?.data || []);

      setPagination(
        response.data?.pagination || {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      );
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
      showToast.error(
        error.response?.data?.message || "Failed to fetch leave records.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Debounced search and automatic fetching
  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        fetchLeaves();
      },
      search.trim() ? 350 : 0,
    );

    return () => clearTimeout(timeoutId);
  }, [activeTab, search, page, limit, sortBy, sortOrder]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return requests;

    return requests.filter((row) => {
      const employeeName = `${row.employee?.user?.first_name || ""} ${
        row.employee?.user?.last_name || ""
      }`.toLowerCase();

      return (
        employeeName.includes(query) ||
        row.leaveType?.toLowerCase().includes(query) ||
        row.leaveStatus?.toLowerCase().includes(query) ||
        row.leaveDate?.toLowerCase().includes(query)
      );
    });
  }, [requests, search]);

  // Approve / Reject leave
  const updateStatus = async (uuid, status) => {
    try {
      await axios.patch(
        `/api/leave/leaves/${uuid}`,
        { status },
        { withCredentials: true },
      );

      showToast.success(`Leave request ${status.toLowerCase()}.`);
      fetchLeaves();
    } catch (error) {
      console.error("Failed to update leave:", error);
      showToast.error(
        error.response?.data?.message || "Failed to update leave request.",
      );
    }
  };

  // Start editing
  const startEditing = (row) => {
    setShowForm(false);

    setEditingLeave({
      uuid: row.uuid,
      leaveType: row.leaveType || "CASUAL",
      leaveDate: row.leaveDate || "",
      leaveSession: row.leaveSession || "FULL_DAY",
      isPaid: row.isPaid ?? true,
    });
  };

  // Update leave
  const updateLeave = async () => {
    if (!editingLeave) return;

    if (!editingLeave.leaveDate) {
      showToast.error("Leave date is required.");
      return;
    }

    try {
      setSavingEdit(true);

      await axios.patch(
        `/api/leave/leaves/${editingLeave.uuid}`,
        {
          leaveType: editingLeave.leaveType,
          leaveDate: editingLeave.leaveDate,
          leaveSession: editingLeave.leaveSession,
          isPaid: editingLeave.isPaid,
        },
        { withCredentials: true },
      );

      showToast.success("Leave request updated successfully.");
      setEditingLeave(null);
      fetchLeaves();
    } catch (error) {
      console.error("Failed to update leave:", error);
      showToast.error(
        error.response?.data?.message || "Failed to update leave request.",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // Add leave
  const addLeave = async (event) => {
    event.preventDefault();

    if (!form.employee || !form.from || !form.to) {
      showToast.error("Employee and leave dates are required.");
      return;
    }

    if (form.from > form.to) {
      showToast.error("From date cannot be after To date.");
      return;
    }

    try {
      await axios.post(
        "/api/leaves",
        {
          employeeId: form.employee,
          leaveType: form.type,
          fromDate: form.from,
          toDate: form.to,
          leaveSession: form.session,
          isPaid: form.isPaid,
          reason: form.reason,
        },
        { withCredentials: true },
      );

      showToast.success("Leave request created.");

      setForm({
        employee: "",
        type: "CASUAL",
        from: "",
        to: "",
        session: "FULL_DAY",
        isPaid: true,
        reason: "",
      });

      setShowForm(false);
      fetchLeaves();
    } catch (error) {
      console.error("Failed to create leave:", error);
      showToast.error(
        error.response?.data?.message || "Failed to create leave request.",
      );
    }
  };

  // Table columns
  const columns = [
    {
      key: "employee",
      header: "Employee",
      render: (row) => {
        const firstName = row.employee?.user?.firstName || "";
        const lastName = row.employee?.user?.lastName || "";

        return `${firstName} ${lastName}`.trim() || "-";
      },
    },
    {
      key: "leaveType",
      header: "Leave Type",
      render: (row) => row.leaveType || "-",
    },
    {
      key: "leaveDate",
      header: "Date",
      render: (row) => row.leaveDate || "-",
    },
    {
      key: "leaveSession",
      header: "Session",
      render: (row) => {
        switch (row.leaveSession) {
          case "FULL_DAY":
            return "Full Day";
          case "FIRST_HALF":
            return "First Half";
          case "SECOND_HALF":
            return "Second Half";
          default:
            return row.leaveSession || "-";
        }
      },
    },
    {
      key: "isPaid",
      header: "Paid",
      render: (row) => (row.isPaid ? "Yes" : "No"),
    },
    {
      key: "leaveStatus",
      header: "Status",
      render: (row) => (
        <Badge tone={STATUS_TONE[row.leaveStatus]}>{row.leaveStatus}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) =>
        activeTab === "PENDING" && row.leaveStatus === "PENDING" ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => startEditing(row)}>
              Edit
            </Button>
            <Button
              size="sm"
              onClick={() => updateStatus(row.uuid, "APPROVED")}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => updateStatus(row.uuid, "REJECTED")}
            >
              Reject
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Standardized HR page heading */}
      <header className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              HUMAN RESOURCES
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
              Leave &amp; LOP
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Manage employee leave requests, approvals, leave history and loss
              of pay.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
                <span className="h-2 w-2 rounded-full bg-blue-300" />
                Leave management
              </span>

              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
                {pagination.total} records
              </span>
            </div>
          </div>

          <div className="relative shrink-0">
            <Button
              onClick={() => {
                setEditingLeave(null);
                setShowForm(true);
              }}
            >
              Apply Leave
            </Button>
          </div>
        </div>
      </header>

      {/* Apply Leave modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:p-6"
          onClick={() => setShowForm(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-leave-modal-title"
            className="relative my-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Standardized modal header */}
            <header className="relative overflow-hidden bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-5 py-5 text-white sm:px-8 sm:py-6">
              <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -right-1 -top-16 h-44 w-44 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 bg-blue-500/10 blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100 sm:h-12 sm:w-12">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M16 3v4M8 3v4M3 10h18M12 14v4M10 16h4" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                      HUMAN RESOURCES
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        id="apply-leave-modal-title"
                        className="text-xl font-bold tracking-tight sm:text-2xl"
                      >
                        Apply for Leave
                      </h2>

                      <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
                        New request
                      </span>
                    </div>

                    <p className="mt-1.5 text-sm leading-5 text-slate-300">
                      Submit a new employee leave request.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Close apply leave form"
                  onClick={() => setShowForm(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xl text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  ×
                </button>
              </div>

              <div className="relative mt-5 flex items-center gap-2 text-xs text-blue-100/90">
                <span className="h-2 w-2 rounded-full bg-blue-300" />
                Employee leave details
                <span className="text-white/40">/</span>
                Dates and leave type
              </div>
            </header>

            <form
              onSubmit={addLeave}
              className="grid grid-cols-1 gap-5 p-5 sm:p-7 md:grid-cols-2"
            >
              <Input
                label="Employee ID"
                required
                value={form.employee}
                onChange={(e) =>
                  setForm({ ...form, employee: e.target.value })
                }
              />

              <Select
                label="Leave Type"
                value={form.type}
                options={LEAVE_TYPE_OPTIONS}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              />

              <Select
                label="Session"
                value={form.session}
                options={SESSION_OPTIONS}
                onChange={(e) =>
                  setForm({ ...form, session: e.target.value })
                }
              />

              <Input
                label="From"
                type="date"
                required
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
              />

              <Input
                label="To"
                type="date"
                required
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
              />

              <Input
                label="Reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />

              <div className="flex items-center gap-3 md:col-span-2">
                <input
                  id="apply-leave-paid"
                  type="checkbox"
                  checked={form.isPaid}
                  onChange={(e) =>
                    setForm({ ...form, isPaid: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="apply-leave-paid"
                  className="text-sm font-medium text-slate-700"
                >
                  Paid Leave
                </label>
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row md:col-span-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>

                <Button type="submit">Submit Leave Request</Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Edit Leave modal */}
      {editingLeave && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:p-6"
          onClick={() => setEditingLeave(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-leave-modal-title"
            className="relative my-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Standardized modal header */}
            <header className="relative overflow-hidden bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-5 py-5 text-white sm:px-8 sm:py-6">
              <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -right-1 -top-16 h-44 w-44 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 bg-blue-500/10 blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-blue-100 sm:h-12 sm:w-12">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M16 3v4M8 3v4M3 10h18" />
                      <path d="m9 16 2 2 4-4" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                      HUMAN RESOURCES
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        id="edit-leave-modal-title"
                        className="text-xl font-bold tracking-tight sm:text-2xl"
                      >
                        Edit Leave Request
                      </h2>

                      <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
                        Update
                      </span>
                    </div>

                    <p className="mt-1.5 text-sm leading-5 text-slate-300">
                      Update the leave details before approving the request.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingLeave(null)}
                  aria-label="Close edit leave form"
                  disabled={savingEdit}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xl text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              <div className="relative mt-5 flex items-center gap-2 text-xs text-blue-100/90">
                <span className="h-2 w-2 rounded-full bg-blue-300" />
                Leave request details
                <span className="text-white/40">/</span>
                Review and update
              </div>
            </header>

            <div className="p-5 sm:p-7">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Select
                  label="Leave Type"
                  value={editingLeave.leaveType}
                  options={LEAVE_TYPE_OPTIONS}
                  onChange={(e) =>
                    setEditingLeave({
                      ...editingLeave,
                      leaveType: e.target.value,
                    })
                  }
                />

                <Select
                  label="Session"
                  value={editingLeave.leaveSession}
                  options={SESSION_OPTIONS}
                  onChange={(e) =>
                    setEditingLeave({
                      ...editingLeave,
                      leaveSession: e.target.value,
                    })
                  }
                />

                <Input
                  label="Leave Date"
                  type="date"
                  required
                  value={editingLeave.leaveDate}
                  onChange={(e) =>
                    setEditingLeave({
                      ...editingLeave,
                      leaveDate: e.target.value,
                    })
                  }
                />

                <div className="flex items-center gap-3">
                  <input
                    id="edit-leave-paid"
                    type="checkbox"
                    checked={editingLeave.isPaid}
                    onChange={(e) =>
                      setEditingLeave({
                        ...editingLeave,
                        isPaid: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="edit-leave-paid"
                    className="text-sm font-medium text-slate-700"
                  >
                    Paid Leave
                  </label>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                <Button
                  variant="secondary"
                  onClick={() => setEditingLeave(null)}
                  disabled={savingEdit}
                >
                  Cancel
                </Button>

                <Button onClick={updateLeave} disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-6 border-b border-cm-border">
        <button
          type="button"
          onClick={() => {
            setActiveTab("PENDING");
            setSearch("");
            setPage(1);
            setEditingLeave(null);
            setShowForm(false);
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
            setPage(1);
            setEditingLeave(null);
            setShowForm(false);
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

      {/* Search and sorting */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <TableSearch
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search employee, leave type or status..."
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            name="sortBy"
            label="Sort by"
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value);
              setPage(1);
            }}
            options={[
              { value: "leaveDate", label: "Leave date" },
              { value: "createdAt", label: "Created date" },
              { value: "updatedAt", label: "Updated date" },
            ]}
            containerClassName="w-full sm:w-44"
          />

          <Select
            name="sortOrder"
            label="Order"
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value);
              setPage(1);
            }}
            options={[
              { value: "DESC", label: "Newest first" },
              { value: "ASC", label: "Oldest first" },
            ]}
            containerClassName="w-full sm:w-40"
          />
        </div>
      </section>

      {/* DataTable with server-side pagination */}
      <DataTable
        columns={columns}
        rows={requests}
        isLoading={loading}
        emptyMessage={
          search.trim()
            ? "No leave requests match your search."
            : activeTab === "PENDING"
              ? "No pending leave requests."
              : "No leave history."
        }
        pagination={pagination}
        onPageChange={setPage}
        onPageSizeChange={(nextLimit) => {
          setLimit(nextLimit);
          setPage(1);
        }}
        pageSizeOptions={[10, 25, 50, 100]}
      />
    </div>
  );
};

export default LeaveLOP;
