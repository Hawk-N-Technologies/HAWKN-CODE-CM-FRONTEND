import { useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

const INITIAL_ONBOARDING = [
  {
    id: "ONB-001",
    name: "Ishita Shah",
    role: "Developer",
    joiningDate: "2026-09-28",
    status: "Documents Pending",
    progress: 60,
  },
  {
    id: "ONB-002",
    name: "Dev Patel",
    role: "Tester",
    joiningDate: "2026-10-01",
    status: "Ready",
    progress: 100,
  },
];

function EmployeeOnboarding() {
  const [records, setRecords] = useState(INITIAL_ONBOARDING);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "Developer",
    joiningDate: "",
    documents: "Pending",
  });

  const add = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.joiningDate) {
      showToast.error("Name and joining date are required.");
      return;
    }
    setRecords((prev) => [
      ...prev,
      {
        id: `ONB-${String(prev.length + 1).padStart(3, "0")}`,
        ...form,
        status: form.documents === "Complete" ? "Ready" : "Documents Pending",
        progress: form.documents === "Complete" ? 100 : 60,
      },
    ]);
    setForm({
      name: "",
      role: "Developer",
      joiningDate: "",
      documents: "Pending",
    });
    setIsOpen(false);
    showToast.success("Onboarding record created.");
  };

  const toggleDocuments = (id) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.id === id
          ? { ...record, status: "Ready", progress: 100, documents: "Complete" }
          : record,
      ),
    );
    showToast.success("Onboarding documents marked complete.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">
            Employee Onboarding
          </h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Track new employee joining, documents and onboarding readiness.
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)}>Start Onboarding</Button>
      </div>

      {isOpen && (
        <form
          onSubmit={add}
          className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-cm-text">New Onboarding</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label="Employee Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Select
              label="Role"
              value={form.role}
              options={["Developer", "Tester", "Project Lead", "BD"].map(
                (v) => ({ value: v, label: v }),
              )}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
            <Input
              label="Joining Date"
              type="date"
              required
              value={form.joiningDate}
              onChange={(e) =>
                setForm({ ...form, joiningDate: e.target.value })
              }
            />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {records.map((record) => (
          <article
            key={record.id}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-cm-text-muted">{record.id}</p>
                <h2 className="mt-1 font-semibold text-cm-text">
                  {record.name}
                </h2>
                <p className="mt-1 text-sm text-cm-text-muted">
                  {record.role} · Joining {record.joiningDate}
                </p>
              </div>
              <Badge tone={record.status === "Ready" ? "success" : "warning"}>
                {record.status}
              </Badge>
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-xs text-cm-text-muted">
                <span>Onboarding progress</span>
                <span>{record.progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-cm-border">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${record.progress}%` }}
                />
              </div>
            </div>
            {record.status !== "Ready" && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => toggleDocuments(record.id)}
              >
                Mark Documents Complete
              </Button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

export default EmployeeOnboarding;
