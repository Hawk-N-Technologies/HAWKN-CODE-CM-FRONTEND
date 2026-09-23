import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

const INITIAL = [
  {
    id: "INC-001",
    employee: "Aarav Shah",
    type: "Salary Increment",
    amount: "10%",
    effectiveDate: "2026-10-01",
    status: "Scheduled",
  },
  {
    id: "BON-001",
    employee: "Mira Patel",
    type: "One-time Bonus",
    amount: "₹15,000",
    effectiveDate: "2026-09-30",
    status: "Approved",
  },
];

function Increments() {
  const [records, setRecords] = useState(INITIAL);
  const [form, setForm] = useState({
    employee: "",
    type: "Salary Increment",
    amount: "",
    effectiveDate: "",
  });

  const add = (event) => {
    event.preventDefault();
    if (!form.employee.trim() || !form.amount || !form.effectiveDate) {
      showToast.error("Complete all required fields.");
      return;
    }
    setRecords((prev) => [
      ...prev,
      {
        id: `HR-${String(prev.length + 1).padStart(3, "0")}`,
        ...form,
        status: "Scheduled",
      },
    ]);
    setForm({
      employee: "",
      type: "Salary Increment",
      amount: "",
      effectiveDate: "",
    });
    showToast.success("Compensation record added.");
  };

  const columns = [
    { key: "employee", header: "Employee" },
    { key: "type", header: "Type" },
    { key: "amount", header: "Amount" },
    { key: "effectiveDate", header: "Effective Date" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={row.status === "Approved" ? "success" : "warning"}>
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Bonuses & Increments</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Manage one-time bonuses and salary increments with effective dates.
        </p>
      </div>

      <form
        onSubmit={add}
        className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm md:grid-cols-4"
      >
        <Input
          label="Employee"
          required
          value={form.employee}
          onChange={(e) => setForm({ ...form, employee: e.target.value })}
        />
        <Select
          label="Type"
          value={form.type}
          options={["Salary Increment", "One-time Bonus"].map((v) => ({
            value: v,
            label: v,
          }))}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        />
        <Input
          label="Amount"
          required
          placeholder="10% / ₹15,000"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <Input
          label="Effective Date"
          type="date"
          required
          value={form.effectiveDate}
          onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
        />
        <div className="flex justify-end md:col-span-4">
          <Button type="submit">Add Record</Button>
        </div>
      </form>

      <DataTable
        columns={columns}
        rows={records}
        emptyMessage="No bonus or increment records."
      />
    </div>
  );
}

export default Increments;
