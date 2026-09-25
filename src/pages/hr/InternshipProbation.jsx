import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

const INITIAL = [
  {
    id: "IP-001",
    employee: "Ishita Shah",
    type: "Probation",
    start: "2026-07-01",
    end: "2026-10-01",
    stipend: "—",
    performance: "Good",
    status: "Review Due",
  },
  {
    id: "IP-002",
    employee: "Dev Patel",
    type: "Internship",
    start: "2026-08-01",
    end: "2026-10-31",
    stipend: "₹12,000",
    performance: "Good",
    status: "Active",
  },
];

function InternshipProbation() {
  const [records, setRecords] = useState(INITIAL);
  const [form, setForm] = useState({
    employee: "",
    type: "Internship",
    start: "",
    end: "",
    stipend: "",
    performance: "Pending",
  });

  const add = (event) => {
    event.preventDefault();
    if (!form.employee.trim() || !form.start || !form.end) {
      showToast.error("Employee and period are required.");
      return;
    }
    setRecords((prev) => [
      ...prev,
      {
        id: `IP-${String(prev.length + 1).padStart(3, "0")}`,
        ...form,
        status: "Active",
      },
    ]);
    setForm({
      employee: "",
      type: "Internship",
      start: "",
      end: "",
      stipend: "",
      performance: "Pending",
    });
    showToast.success("Internship / probation record added.");
  };

  const columns = [
    { key: "employee", header: "Employee" },
    { key: "type", header: "Type" },
    { key: "start", header: "Start" },
    { key: "end", header: "End" },
    { key: "stipend", header: "Stipend" },
    { key: "performance", header: "Performance" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={row.status === "Active" ? "success" : "warning"}>
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">
          Internship / Probation
        </h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Track internship and probation periods, performance and intern
          stipend.
        </p>
      </div>

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
          label="Type"
          value={form.type}
          options={["Internship", "Probation"].map((v) => ({
            value: v,
            label: v,
          }))}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        />
        <Input
          label="Stipend"
          placeholder="e.g. ₹12,000"
          value={form.stipend}
          onChange={(e) => setForm({ ...form, stipend: e.target.value })}
        />
        <Input
          label="Start Date"
          type="date"
          required
          value={form.start}
          onChange={(e) => setForm({ ...form, start: e.target.value })}
        />
        <Input
          label="End Date"
          type="date"
          required
          value={form.end}
          onChange={(e) => setForm({ ...form, end: e.target.value })}
        />
        <Select
          label="Performance"
          value={form.performance}
          options={["Pending", "Good", "Needs Improvement", "Excellent"].map(
            (v) => ({ value: v, label: v }),
          )}
          onChange={(e) => setForm({ ...form, performance: e.target.value })}
        />
        <div className="flex justify-end md:col-span-3">
          <Button type="submit">Add Record</Button>
        </div>
      </form>

      <DataTable
        columns={columns}
        rows={records}
        emptyMessage="No internship or probation records."
      />
    </div>
  );
}

export default InternshipProbation;
