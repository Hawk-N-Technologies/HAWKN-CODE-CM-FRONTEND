import { useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import DataTable from "../../components/tables/DataTable";
import TableSearch from "../../components/tables/TableSearch";
import Select from "../../components/common/Select";
const initial = [
  [
    "TEST-001",
    "Authentication API",
    "Acme Retail ERP",
    "Functional",
    "High",
    "Queued",
  ],
  ["TEST-002", "Dashboard UI", "Acme Retail ERP", "UI", "Medium", "In Testing"],
  [
    "TEST-003",
    "Reports Export",
    "Internal HRMS",
    "Regression",
    "High",
    "Queued",
  ],
];
export default function TestingQueue() {
  const [data, setData] = useState(initial),
    [q, setQ] = useState(""),
    [f, setF] = useState("All");
  const rows = useMemo(
    () =>
      data.filter(
        (x) =>
          (f === "All" || x[5] === f) &&
          (!q || x.join(" ").toLowerCase().includes(q.toLowerCase())),
      ),
    [data, q, f],
  );
  const columns = [
    { key: "id", header: "Test ID", render: (r) => r[0] },
    { key: "title", header: "Test Item", render: (r) => r[1] },
    { key: "project", header: "Project", render: (r) => r[2] },
    { key: "type", header: "Type", render: (r) => r[3] },
    {
      key: "priority",
      header: "Priority",
      render: (r) => (
        <Badge tone={r[4] === "High" ? "danger" : "warning"}>{r[4]}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Select
          value={r[5]}
          options={["Queued", "In Testing", "Passed", "Failed"].map((v) => ({
            value: v,
            label: v,
          }))}
          onChange={(e) =>
            setData((p) =>
              p.map((x) =>
                x[0] === r[0]
                  ? [x[0], x[1], x[2], x[3], x[4], e.target.value]
                  : x,
              ),
            )
          }
        />
      ),
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Testing Queue</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Manage items waiting for tester execution.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TableSearch
          value={q}
          onChange={setQ}
          placeholder="Search testing queue…"
        />
        <Select
          label="Status"
          value={f}
          options={[
            { value: "All", label: "All statuses" },
            ...["Queued", "In Testing", "Passed", "Failed"].map((v) => ({
              value: v,
              label: v,
            })),
          ]}
          onChange={(e) => setF(e.target.value)}
        />
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage="Testing queue is empty."
      />
    </div>
  );
}
