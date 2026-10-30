import { useEffect, useState } from "react";
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
<<<<<<< HEAD
        params: {
          status: activeTab,
          search: search.trim() || undefined,
          page,
          limit,
          sortBy,
          sortOrder,
        },
=======
        params: { status: activeTab },
>>>>>>> feat/HR-update
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

<<<<<<< HEAD
    return () => clearTimeout(timeoutId);
  }, [activeTab, search, page, limit, sortBy, sortOrder]);
=======
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
>>>>>>> feat/HR-update

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
          <div className="flex gap-2">
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
      {/* Page heading and Apply Leave action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Leave & LOP</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Manage leave requests, approvals and LOP.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingLeave(null);
            setShowForm((value) => !value);
          }}
        >
          {showForm ? "Close Form" : "Apply Leave"}
        </Button>
      </div>

      {/* Apply Leave form */}
      {showForm && (
        <div className="overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card shadow-sm">
          <div className="relative isolate overflow-hidden bg-gradient-to-r from-[#0b1833] via-[#122b4d] to-[#1c4168] px-6 py-5">
            <div className="pointer-events-none absolute -right-8 -top-16 h-44 w-44 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-1 top-4 h-28 w-28 rounded-full border border-white/10" />

            <div className="relative flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
                <svg
                  width="25"
                  height="25"
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

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Apply for Leave
                </h2>
                <p className="mt-1 text-sm text-blue-100/75">
                  Submit a new employee leave request.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={addLeave}
            className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3"
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
              onChange={(e) => setForm({ ...form, session: e.target.value })}
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isPaid}
                onChange={(e) =>
                  setForm({ ...form, isPaid: e.target.checked })
                }
              />
              <span className="text-sm text-cm-text">Paid Leave</span>
            </div>

            <div className="flex justify-end gap-3 md:col-span-3">
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
        </div>
      )}

      {/* Edit Leave form - inline, not a popup */}
      {editingLeave && (
        <div className="overflow-hidden rounded-cm-lg border border-cm-border bg-cm-card shadow-sm">
          <div className="relative isolate overflow-hidden bg-gradient-to-r from-[#0b1833] via-[#122b4d] to-[#1c4168] px-6 py-5">
            <div className="pointer-events-none absolute -right-8 -top-16 h-44 w-44 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-1 top-4 h-28 w-28 rounded-full border border-white/10" />

            <div className="relative flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
                  <svg
                    width="25"
                    height="25"
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

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">
                      Edit Leave Request
                    </h2>
                    <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
                      Update
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-blue-100/75">
                    Update the leave details before approving the request.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingLeave(null)}
                aria-label="Close edit leave form"
                className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingLeave.isPaid}
                  onChange={(e) =>
                    setEditingLeave({
                      ...editingLeave,
                      isPaid: e.target.checked,
                    })
                  }
                />
                <span className="text-sm text-cm-text">Paid Leave</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setEditingLeave(null)}
              >
                Cancel
              </Button>
              <Button onClick={updateLeave} disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
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