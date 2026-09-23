import { useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";

const PROJECTS = [
  {
    id: "PRJ-001",
    name: "Acme Retail ERP",
    client: "Acme Retail",
    deadline: "2026-10-15",
    team: 5,
    progress: 72,
    status: "In Progress",
  },
  {
    id: "PRJ-002",
    name: "Northstar Website",
    client: "Northstar Foods",
    deadline: "2026-11-02",
    team: 4,
    progress: 41,
    status: "Planning",
  },
  {
    id: "PRJ-003",
    name: "Internal HRMS",
    client: "Internal",
    deadline: "2026-09-25",
    team: 6,
    progress: 79,
    status: "In Progress",
  },
];

function AssignedProjects() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PROJECTS;
    return PROJECTS.filter((p) =>
      [p.id, p.name, p.client, p.status].some((v) =>
        String(v).toLowerCase().includes(q),
      ),
    );
  }, [search]);

  const columns = [
    { key: "id", header: "Project ID" },
    { key: "name", header: "Project" },
    { key: "client", header: "Client" },
    { key: "deadline", header: "Deadline" },
    { key: "team", header: "Team" },
    {
      key: "progress",
      header: "Progress",
      render: (row) => `${row.progress}%`,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={row.status === "In Progress" ? "info" : "warning"}>
          {row.status}
        </Badge>
      ),
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
      <div>
        <h1 className="text-xl font-bold text-cm-text">Assigned Projects</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Projects assigned to you as Project Lead.
        </p>
      </div>

      {selected && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-cm-text-muted">{selected.id}</p>
              <h2 className="mt-1 text-lg font-semibold text-cm-text">
                {selected.name}
              </h2>
              <p className="mt-1 text-sm text-cm-text-muted">
                {selected.client}
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
              ["Deadline", selected.deadline],
              ["Team", selected.team],
              ["Progress", `${selected.progress}%`],
              ["Status", selected.status],
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
        </section>
      )}

      <div className="flex flex-col gap-4">
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Search project, client or status…"
        />
        <DataTable
          columns={columns}
          rows={filtered}
          emptyMessage="No assigned projects found."
        />
      </div>
    </div>
  );
}

export default AssignedProjects;
