import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";

const KPIS = [
  { label: "Assigned Projects", value: "3" },
  { label: "Active Phases", value: "7" },
  { label: "Open Tasks", value: "24" },
  { label: "Completed Tasks", value: "38" },
  { label: "Average Progress", value: "64%" },
];

const projects = [
  {
    id: "PRJ-001",
    name: "Acme Retail ERP",
    client: "Acme Retail",
    progress: 72,
    status: "In Progress",
    deadline: "15 Oct 2026",
  },
  {
    id: "PRJ-002",
    name: "Northstar Website",
    client: "Northstar Foods",
    progress: 41,
    status: "Planning",
    deadline: "02 Nov 2026",
  },
  {
    id: "PRJ-003",
    name: "Internal HRMS",
    client: "Internal",
    progress: 79,
    status: "In Progress",
    deadline: "25 Sep 2026",
  },
];

function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">
          Welcome back, Project Lead
        </h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Track assigned projects, planning, phases, tasks and overall delivery
          progress.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {KPIS.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-cm-text">
            Assigned Projects
          </h2>
          <span className="text-xs text-cm-text-muted">Current portfolio</span>
        </div>

        <div className="mt-4 space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border border-cm-border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-cm-text-muted">
                    {project.id} · {project.client}
                  </p>
                  <h3 className="mt-1 font-medium text-cm-text">
                    {project.name}
                  </h3>
                </div>
                <Badge
                  tone={project.status === "In Progress" ? "info" : "warning"}
                >
                  {project.status}
                </Badge>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-cm-border">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-cm-text-muted">
                <span>{project.progress}% complete</span>
                <span>Deadline: {project.deadline}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
