import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";

const projects = [
  {
    id: "PRJ-001",
    name: "Acme Retail ERP",
    progress: 72,
    status: "In Progress",
  },
  { id: "PRJ-003", name: "Internal HRMS", progress: 79, status: "In Progress" },
];

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Developer Dashboard</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          View your projects, tasks, testing and development progress.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Projects" value="2" />
        <StatCard label="My Tasks" value="12" />
        <StatCard label="Completed Tasks" value="18" />
        <StatCard label="Open Bugs" value="4" />
      </div>
      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-cm-text">My Projects</h2>
        <div className="mt-4 space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="rounded-lg border border-cm-border p-4">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs text-cm-text-muted">{p.id}</p>
                  <h3 className="mt-1 font-medium text-cm-text">{p.name}</h3>
                </div>
                <Badge tone="info">{p.status}</Badge>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-cm-border">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-cm-text-muted">
                {p.progress}% complete
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
