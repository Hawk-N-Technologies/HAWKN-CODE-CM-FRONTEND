import { useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import TableSearch from "../../components/tables/TableSearch";
import DataTable from "../../components/tables/DataTable";
import { showToast } from "../../components/common/Toast";

const INITIAL = [
  {
    id: "TASK-001",
    title: "Authentication API",
    phase: "Core Development",
    assignee: "Aarav Shah",
    priority: "High",
    status: "In Progress",
  },
  {
    id: "TASK-002",
    title: "Dashboard UI",
    phase: "Core Development",
    assignee: "Neha Joshi",
    priority: "Medium",
    status: "Developer Testing",
  },
  {
    id: "TASK-003",
    title: "Reports",
    phase: "Testing",
    assignee: "Dev Patel",
    priority: "Low",
    status: "Idle",
  },
];

function Tasks() {
  const [tasks, setTasks] = useState(INITIAL);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    phase: "Core Development",
    assignee: "Aarav Shah",
    priority: "Medium",
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((task) =>
      Object.values(task).some((value) =>
        String(value).toLowerCase().includes(q),
      ),
    );
  }, [tasks, search]);

  const add = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: `TASK-${String(prev.length + 1).padStart(3, "0")}`,
        ...form,
        status: "Idle",
      },
    ]);
    setForm((prev) => ({ ...prev, title: "" }));
    showToast.success("Task created.");
  };

  const columns = [
    { key: "id", header: "ID" },
    { key: "title", header: "Task" },
    { key: "phase", header: "Phase" },
    { key: "assignee", header: "Assignee" },
    {
      key: "priority",
      header: "Priority",
      render: (row) => (
        <Badge
          tone={
            row.priority === "High"
              ? "danger"
              : row.priority === "Medium"
                ? "warning"
                : "neutral"
          }
        >
          {row.priority}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge tone="info">{row.status}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Tasks</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Create, assign, prioritize and track project tasks.
        </p>
      </div>

      <form
        onSubmit={add}
        className="grid grid-cols-1 gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm md:grid-cols-4"
      >
        <Input
          label="Task"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <Input
          label="Phase"
          value={form.phase}
          onChange={(e) => setForm({ ...form, phase: e.target.value })}
        />
        <Select
          label="Assignee"
          value={form.assignee}
          options={["Aarav Shah", "Neha Joshi", "Dev Patel", "Ishita Shah"].map(
            (v) => ({ value: v, label: v }),
          )}
          onChange={(e) => setForm({ ...form, assignee: e.target.value })}
        />
        <Select
          label="Priority"
          value={form.priority}
          options={["High", "Medium", "Low"].map((v) => ({
            value: v,
            label: v,
          }))}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
        />
        <div className="md:col-span-4 flex justify-end">
          <Button type="submit">Create Task</Button>
        </div>
      </form>

      <TableSearch
        value={search}
        onChange={setSearch}
        placeholder="Search tasks…"
      />
      <DataTable
        columns={columns}
        rows={filtered}
        emptyMessage="No tasks found."
      />
    </div>
  );
}

export default Tasks;
