import { useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import Select from "../../components/common/Select";

const STATUSES = [
  "Idle",
  "In Progress",
  "Developer Testing",
  "Tester",
  "Client Testing",
  "Completed",
];
const INITIAL = [
  {
    id: "TASK-001",
    title: "Authentication API",
    project: "Acme Retail ERP",
    phase: "Core Development",
    priority: "High",
    status: "In Progress",
  },
  {
    id: "TASK-002",
    title: "Dashboard UI",
    project: "Acme Retail ERP",
    phase: "Core Development",
    priority: "Medium",
    status: "Developer Testing",
  },
  {
    id: "TASK-003",
    title: "Reports",
    project: "Internal HRMS",
    phase: "Testing",
    priority: "Low",
    status: "Idle",
  },
];

export default function MyTasks() {
  const [tasks, setTasks] = useState(INITIAL),
    [q, setQ] = useState(""),
    [filter, setFilter] = useState("All");
  const rows = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (filter === "All" || t.status === filter) &&
          (!q ||
            Object.values(t).some((v) =>
              String(v).toLowerCase().includes(q.toLowerCase()),
            )),
      ),
    [tasks, q, filter],
  );
  const update = (id, status) =>
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, status } : t)));
  const columns = [
    { key: "id", header: "Task ID" },
    { key: "title", header: "Task" },
    { key: "project", header: "Project" },
    { key: "phase", header: "Phase" },
    {
      key: "priority",
      header: "Priority",
      render: (r) => (
        <Badge
          tone={
            r.priority === "High"
              ? "danger"
              : r.priority === "Medium"
                ? "warning"
                : "neutral"
          }
        >
          {r.priority}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Select
          value={r.status}
          options={STATUSES.map((v) => ({ value: v, label: v }))}
          onChange={(e) => update(r.id, e.target.value)}
        />
      ),
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">My Tasks</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Tasks assigned to you and their current status.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TableSearch value={q} onChange={setQ} placeholder="Search tasks…" />
        <Select
          label="Status"
          value={filter}
          options={[
            { value: "All", label: "All statuses" },
            ...STATUSES.map((v) => ({ value: v, label: v })),
          ]}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <DataTable columns={columns} rows={rows} emptyMessage="No tasks found." />
    </div>
  );
}
