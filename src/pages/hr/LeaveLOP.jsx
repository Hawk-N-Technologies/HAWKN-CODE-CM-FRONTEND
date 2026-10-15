import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
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

  const fetchLeaves = async () => {
    try {
      setLoading(true);

      const response = await axios.get("/api/leave/leaves", {
        params: {
          status: activeTab,
        },
        withCredentials: true,
      });

      setRequests(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch leaves:", error);

      showToast.error(
        error.response?.data?.message || "Failed to fetch leave records.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [activeTab]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return requests;
    }

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

  const updateStatus = async (uuid, status) => {
    try {
      await axios.patch(
        `/api/leave/leaves/${uuid}`,
        {
          status,
        },
        {
          withCredentials: true,
        },
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

  const startEditing = (row) => {
    setEditingLeave({
      uuid: row.uuid,
      leaveType: row.leaveType || "CASUAL",
      leaveDate: row.leaveDate || "",
      leaveSession: row.leaveSession || "FULL_DAY",
      isPaid: row.isPaid ?? true,
    });
  };

  const updateLeave = async () => {
    if (!editingLeave) {
      return;
    }

    if (!editingLeave.leaveDate) {
      showToast.error("Leave date is required.");
      return;
    }

    try {
      setSavingEdit(true);
      console.log(editingLeave);
      await axios.patch(
        `/api/leave/leaves/${editingLeave.uuid}`,
        {
          leaveType: editingLeave.leaveType,
          leaveDate: editingLeave.leaveDate,
          leaveSession: editingLeave.leaveSession,
          isPaid: editingLeave.isPaid,
        },
        {
          withCredentials: true,
        },
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
        "/api/company/leaves",
        {
          employeeId: form.employee,
          leaveType: form.type,
          fromDate: form.from,
          toDate: form.to,
          leaveSession: form.session,
          isPaid: form.isPaid,
          reason: form.reason,
        },
        {
          withCredentials: true,
        },
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

  const columns = [
    {
      key: "employee",
      header: "Employee",
      render: (row) => {
        const firstName = row.employee?.user?.first_name || "";
        const lastName = row.employee?.user?.last_name || "";

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
      header: "",
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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Leave & LOP</h1>

          <p className="mt-1 text-sm text-cm-text-muted">
            Manage leave requests, approvals and LOP.
          </p>
        </div>

        <Button onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Close" : "Add Leave"}
        </Button>
      </div>

      {/* Add Leave Form */}
      {showForm && (
        <form
          onSubmit={addLeave}
          className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm md:grid-cols-3"
        >
          <Input
            label="Employee ID"
            required
            value={form.employee}
            onChange={(e) =>
              setForm({
                ...form,
                employee: e.target.value,
              })
            }
          />

          <Select
            label="Leave Type"
            value={form.type}
            options={LEAVE_TYPE_OPTIONS}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value,
              })
            }
          />

          <Select
            label="Session"
            value={form.session}
            options={SESSION_OPTIONS}
            onChange={(e) =>
              setForm({
                ...form,
                session: e.target.value,
              })
            }
          />

          <Input
            label="From"
            type="date"
            required
            value={form.from}
            onChange={(e) =>
              setForm({
                ...form,
                from: e.target.value,
              })
            }
          />

          <Input
            label="To"
            type="date"
            required
            value={form.to}
            onChange={(e) =>
              setForm({
                ...form,
                to: e.target.value,
              })
            }
          />

          <Input
            label="Reason"
            value={form.reason}
            onChange={(e) =>
              setForm({
                ...form,
                reason: e.target.value,
              })
            }
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isPaid}
              onChange={(e) =>
                setForm({
                  ...form,
                  isPaid: e.target.checked,
                })
              }
            />

            <span className="text-sm text-cm-text">Paid Leave</span>
          </div>

          <div className="flex justify-end gap-3 md:col-span-3">
            <Button type="submit">Create Request</Button>
          </div>
        </form>
      )}

      {/* Edit Leave */}
      {editingLeave && (
        <div className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-cm-text">
                Edit Leave Request
              </h2>

              <p className="mt-1 text-sm text-cm-text-muted">
                Update the leave details before approving the request.
              </p>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setEditingLeave(null)}
            >
              Cancel
            </Button>
          </div>

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
            <Button variant="secondary" onClick={() => setEditingLeave(null)}>
              Cancel
            </Button>

            <Button onClick={updateLeave} disabled={savingEdit}>
              {savingEdit ? "Saving..." : "Save Changes"}
            </Button>
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
            setEditingLeave(null);
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
            setEditingLeave(null);
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

      {/* Search */}
      <TableSearch
        value={search}
        onChange={setSearch}
        placeholder="Search employee, leave type or status…"
      />

      {/* Table */}
      {loading ? (
        <Loader />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          emptyMessage={
            activeTab === "PENDING"
              ? "No pending leave requests."
              : "No leave history."
          }
        />
      )}
    </div>
  );
};

export default LeaveLOP;
