import Badge from "../../components/common/Badge";
const projects = [
  ["PRJ-001", "Acme Retail ERP", "Rohan Mehta", 72],
  ["PRJ-003", "Internal HRMS", "Rohan Mehta", 79],
  ["PRJ-005", "Client Portal", "Priya Shah", 54],
];
export default function AssignedProjects() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Assigned Projects</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Projects assigned to you for testing.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {projects.map((p) => (
          <article
            key={p[0]}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-cm-text-muted">{p[0]}</p>
                <h2 className="mt-1 font-semibold text-cm-text">{p[1]}</h2>
              </div>
              <Badge tone="info">Testing</Badge>
            </div>
            <p className="mt-3 text-sm text-cm-text-muted">Lead: {p[2]}</p>
            <div className="mt-4 h-2 rounded-full bg-cm-border">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${p[3]}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-cm-text-muted">{p[3]}% progress</p>
          </article>
        ))}
      </div>
    </div>
  );
}
