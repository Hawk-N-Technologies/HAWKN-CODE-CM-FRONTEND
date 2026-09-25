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
    id: "PAY-001",
    employee: "Aarav Shah",
    month: "September 2026",
    base: 55000,
    lop: 0,
    bonus: 3000,
    net: 58000,
    method: "Bank Transfer",
    status: "Processed",
  },
  {
    id: "PAY-002",
    employee: "Mira Patel",
    month: "September 2026",
    base: 52000,
    lop: 1500,
    bonus: 0,
    net: 50500,
    method: "Bank Transfer",
    status: "Pending",
  },
];

function Payroll() {
  const [records, setRecords] = useState(INITIAL);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    employee: "",
    month: "September 2026",
    base: 0,
    lop: 0,
    bonus: 0,
    method: "Bank Transfer",
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter(
      (row) =>
        row.employee.toLowerCase().includes(query) ||
        row.month.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query),
    );
  }, [records, search]);

  const net = Math.max(
    0,
    Number(form.base) - Number(form.lop) + Number(form.bonus),
  );

  const add = (event) => {
    event.preventDefault();
    if (!form.employee.trim()) {
      showToast.error("Employee is required.");
      return;
    }
    setRecords((prev) => [
      ...prev,
      {
        id: `PAY-${String(prev.length + 1).padStart(3, "0")}`,
        ...form,
        net,
        status: "Pending",
      },
    ]);
    setForm({
      employee: "",
      month: "September 2026",
      base: 0,
      lop: 0,
      bonus: 0,
      method: "Bank Transfer",
    });
    setShowForm(false);
    showToast.success("Payroll record created.");
  };

  const process = (id) => {
    setRecords((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, status: "Processed" } : row,
      ),
    );
    showToast.success("Payroll marked as processed.");
  };

  const columns = [
    { key: "employee", header: "Employee" },
    { key: "month", header: "Month" },
    {
      key: "base",
      header: "Base Salary",
      render: (row) => `₹${row.base.toLocaleString()}`,
    },
    {
      key: "lop",
      header: "LOP",
      render: (row) => `₹${row.lop.toLocaleString()}`,
    },
    {
      key: "bonus",
      header: "Bonus",
      render: (row) => `₹${row.bonus.toLocaleString()}`,
    },
    {
      key: "net",
      header: "Net Salary",
      render: (row) => `₹${row.net.toLocaleString()}`,
    },
    { key: "method", header: "Payment Method" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={row.status === "Processed" ? "success" : "warning"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "Pending" ? (
          <Button size="sm" onClick={() => process(row.id)}>
            Process
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Payroll</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Payroll based on attendance and LOP, payment methods and people
            ledger.
          </p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>
          Create Payroll
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
          <Input
            label="Month"
            value={form.month}
            onChange={(e) => setForm({ ...form, month: e.target.value })}
          />
          <Input
            label="Base Salary"
            type="number"
            value={form.base}
            onChange={(e) => setForm({ ...form, base: Number(e.target.value) })}
          />
          <Input
            label="LOP Deduction"
            type="number"
            value={form.lop}
            onChange={(e) => setForm({ ...form, lop: Number(e.target.value) })}
          />
          <Input
            label="Bonus"
            type="number"
            value={form.bonus}
            onChange={(e) =>
              setForm({ ...form, bonus: Number(e.target.value) })
            }
          />
          <Select
            label="Payment Method"
            value={form.method}
            options={["Bank Transfer", "Cash", "Other"].map((v) => ({
              value: v,
              label: v,
            }))}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
          />
          <div className="md:col-span-3 rounded-lg border border-cm-border p-4 text-sm text-cm-text">
            Calculated Net Salary: <strong>₹{net.toLocaleString()}</strong>
          </div>
          <div className="flex justify-end md:col-span-3">
            <Button type="submit">Save Payroll</Button>
          </div>
        </form>
      )}

      <TableSearch
        value={search}
        onChange={setSearch}
        placeholder="Search employee, month or status…"
      />
      <DataTable
        columns={columns}
        rows={filtered}
        emptyMessage="No payroll records."
      />
    </div>
  );
}

export default Payroll;
