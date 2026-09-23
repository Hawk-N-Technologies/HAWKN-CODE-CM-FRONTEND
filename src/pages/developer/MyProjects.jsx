import { useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";

const DATA = [
  {
    id: "PRJ-001",
    name: "Acme Retail ERP",
    client: "Acme Retail",
    lead: "Rohan Mehta",
    deadline: "2026-10-15",
    progress: 72,
    status: "In Progress",
  },
  {
    id: "PRJ-003",
    name: "Internal HRMS",
    client: "Internal",
    lead: "Rohan Mehta",
    deadline: "2026-09-25",
    progress: 79,
    status: "In Progress",
  },
];

export default function MyProjects() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const rows = useMemo(
    () =>
      DATA.filter(
        (p) =>
          !q ||
          Object.values(p).some((v) =>
            String(v).toLowerCase().includes(q.toLowerCase()),
          ),
      ),
    [q],
  );
  const columns = [
    { key: "id", header: "Project ID" },
    { key: "name", header: "Project" },
    { key: "client", header: "Client" },
    { key: "deadline", header: "Deadline" },
    { key: "progress", header: "Progress", render: (r) => `${r.progress}%` },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone="info">{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Button size="sm" variant="outline" onClick={() => setSelected(r)}>
          Details
        </Button>
      ),
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">My Projects</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Projects assigned to you.
        </p>
      </div>
      {selected && (
        <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-cm-text-muted">{selected.id}</p>
              <h2 className="mt-1 text-lg font-semibold text-cm-text">
                {selected.name}
              </h2>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected(null)}
            >
              Close
            </Button>
          </div>
        </section>
      )}
      <TableSearch
        value={q}
        onChange={setQ}
        placeholder="Search my projects…"
      />
      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage="No assigned projects found."
      />
    </div>
  );
}
