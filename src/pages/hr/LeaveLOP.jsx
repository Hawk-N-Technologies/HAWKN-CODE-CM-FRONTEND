import { useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

const INITIAL = [
  {
    id: "LV-001",
    employee: "Neha Joshi",
    type: "Casual Leave",
    from: "2026-09-23",
    to: "2026-09-24",
    days: 2,
    lop: 0,
    status: "Pending",
  },
  {
    id: "LV-002",
    employee: "Aarav Shah",
    type: "Sick Leave",
    from: "2026-09-18",
    to: "2026-09-18",
    days: 1,
    lop: 0,
    status: "Approved",
  },
];

const TONE = { Pending: "warning", Approved: "success", Rejected: "danger" };

function LeaveLOP() {
  const [requests, setRequests] = useState(INITIAL);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    employee: "",
    type: "Casual Leave",
    from: "",
    to: "",
    days: 1,
    lop: 0,
  });
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requests;
    return requests.filter(
      (row) =>
        row.employee.toLowerCase().includes(query) ||
        row.type.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query),
    );
  }, [requests, search]);

  const add = (event) => {
    event.preventDefault();
    if (!form.employee.trim() || !form.from || !form.to) {
      showToast.error("Employee and leave dates are required.");
      return;
    }
    setRequests((prev) => [
      ...prev,
      {
        id: `LV-${String(prev.length + 1).padStart(3, "0")}`,
        ...form,
        status: "Pending",
      },
    ]);
    setForm({
      employee: "",
      type: "Casual Leave",
      from: "",
      to: "",
      days: 1,
      lop: 0,
    });
    setShowForm(false);
    showToast.success("Leave request added.");
  };

  const updateStatus = (id, status) => {
    setRequests((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status } : row)),
    );
    showToast.success(`Leave request ${status.toLowerCase()}.`);
  };

  const columns = [
    { key: "employee", header: "Employee" },
    { key: "type", header: "Leave Type" },
    { key: "from", header: "From" },
    { key: "to", header: "To" },
    { key: "days", header: "Days" },
    { key: "lop", header: "LOP" },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone={TONE[row.status]}>{row.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "Pending" ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => updateStatus(row.id, "Approved")}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => updateStatus(row.id, "Rejected")}
            >
              Reject
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Leave & LOP</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Manage leave requests, LOP and holidays / leave settings.
          </p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>
          Add Leave
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={add}
          className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm md:grid-cols-3"
        >
          <Input
            label="Employee"
            required
            value={form.employee}
            onChange={(e) => setForm({ ...form, employee: e.target.value })}
          />
          <Select
            label="Leave Type"
            value={form.type}
            options={[
              "Casual Leave",
              "Sick Leave",
              "Paid Leave",
              "Unpaid Leave",
            ].map((v) => ({ value: v, label: v }))}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <Input
            label="Days"
            type="number"
            value={form.days}
            onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}
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
            label="LOP Days"
            type="number"
            value={form.lop}
            onChange={(e) => setForm({ ...form, lop: Number(e.target.value) })}
          />
          <div className="flex justify-end gap-3 md:col-span-3">
            <Button type="submit">Create Request</Button>
          </div>
        </form>
      )}

      <TableSearch
        value={search}
        onChange={setSearch}
        placeholder="Search employee, leave type or status…"
      />
      <DataTable
        columns={columns}
        rows={filtered}
        emptyMessage="No leave records."
      />
    </div>
  );
}

export default LeaveLOP;
