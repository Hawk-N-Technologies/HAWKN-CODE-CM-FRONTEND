import { useMemo, useState } from "react";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import { showToast } from "../../components/common/Toast";

const INITIAL_PROJECTS = [
  {
    id: "PRJ-001",
    name: "Acme Retail ERP",
    client: "Acme Retail",
    lead: "Rohan Mehta",
    tier: "Tier I",
    deadline: "2026-10-15",
    status: "In Development",
    progress: 58,
    phases: 4,
    completedPhases: 2,
  },
  {
    id: "PRJ-002",
    name: "Northstar Website",
    client: "Northstar Foods",
    lead: "Mira Patel",
    tier: "Tier II",
    deadline: "2026-11-02",
    status: "Planning",
    progress: 18,
    phases: 3,
    completedPhases: 0,
  },
];

const STATUS_TONE = {
  Planning: "info",
  "In Development": "warning",
  Testing: "purple",
  Completed: "success",
};

function ProjectManagement() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    client: "",
    lead: "",
    tier: "Tier I",
    deadline: "",
    status: "Planning",
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.client.toLowerCase().includes(query) ||
        project.lead.toLowerCase().includes(query) ||
        project.status.toLowerCase().includes(query),
    );
  }, [projects, search]);

  const createProject = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.client.trim()) {
      showToast.error("Project name and client are required.");
      return;
    }

    const project = {
      id: `PRJ-${String(projects.length + 1).padStart(3, "0")}`,
      ...form,
      progress: 0,
      phases: 0,
      completedPhases: 0,
    };

    setProjects((prev) => [project, ...prev]);
    setForm({
      name: "",
      client: "",
      lead: "",
      tier: "Tier I",
      deadline: "",
      status: "Planning",
    });
    setIsCreateOpen(false);
    showToast.success("Project created.");
  };

  const columns = [
    { key: "id", header: "Project ID" },
    { key: "name", header: "Project" },
    { key: "client", header: "Client" },
    { key: "lead", header: "Project Lead" },
    { key: "tier", header: "Tier" },
    { key: "deadline", header: "Deadline" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>{row.status}</Badge>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      render: (row) => `${row.progress}%`,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button size="sm" variant="outline" onClick={() => setSelected(row)}>
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-cm-text">Project Management</h1>
          <p className="mt-1 text-sm text-cm-text-muted">
            Manage projects, deadlines, planning, phases, tasks, testing and
            delivery status.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Create Project</Button>
      </div>

      {isCreateOpen && (
        <form
          onSubmit={createProject}
          className="flex flex-col gap-4 rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-cm-text">Create Project</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Project Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Client"
              required
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
            />
            <Input
              label="Project Lead"
              value={form.lead}
              onChange={(e) => setForm({ ...form, lead: e.target.value })}
            />
            <Select
              label="Project Tier"
              value={form.tier}
              options={["Tier I", "Tier II", "Tier III"].map((v) => ({
                value: v,
                label: v,
              }))}
              onChange={(e) => setForm({ ...form, tier: e.target.value })}
            />
            <Input
              label="Deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-cm-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      )}

      {selected && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-cm-text-muted">{selected.id}</p>
              <h2 className="mt-1 text-lg font-semibold text-cm-text">
                {selected.name}
              </h2>
              <p className="mt-1 text-sm text-cm-text-muted">
                {selected.client} · {selected.lead || "Unassigned"}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected(null)}
            >
              Close
            </Button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Timeline", selected.deadline || "Not set"],
              ["Technology", "Not configured"],
              [
                "Phases",
                `${selected.completedPhases}/${selected.phases} completed`,
              ],
              ["Progress", `${selected.progress}%`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-cm-border p-4"
              >
                <p className="text-xs text-cm-text-muted">{label}</p>
                <p className="mt-1 text-sm font-semibold text-cm-text">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              "Overview",
              "Client",
              "Team",
              "Technology",
              "Documents",
              "Deployment",
              "Phases",
              "Modules / Features",
              "Tasks",
              "Testing",
              "Bugs",
              "Delivery",
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-cm-border p-4"
              >
                <p className="text-sm font-medium text-cm-text">{item}</p>
                <p className="mt-1 text-xs text-cm-text-muted">
                  Project {item.toLowerCase()} will appear here.
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-4">
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Search project, client, lead or status…"
        />
        <DataTable
          columns={columns}
          rows={filtered}
          emptyMessage="No projects found."
        />
      </div>
    </div>
  );
}

export default ProjectManagement;
