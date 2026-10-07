import Badge from "../../components/common/Badge";

const project = {
  id: "PRJ-001",
  name: "Acme Retail ERP",
  client: "Acme Retail",
  lead: "Rohan Mehta",
  status: "In Progress",
  progress: 72,
  deadline: "2026-10-15",
  technology: "React, Node.js, PostgreSQL",
  description:
    "Enterprise retail management system covering inventory, customers, orders, reports and role-based access.",
};

const team = [
  { name: "Rohan Mehta", role: "Project Lead" },
  { name: "Talha Malek", role: "Developer" },
  { name: "Ankit Patel", role: "Tester" },
  { name: "Priya Shah", role: "Business Analyst" },
];

const milestones = [
  { name: "BRD Approved", date: "2026-07-15", status: "Completed" },
  { name: "Development Started", date: "2026-07-16", status: "Completed" },
  { name: "Testing Started", date: "2026-10-06", status: "In Progress" },
  { name: "Final Delivery", date: "2026-10-15", status: "Upcoming" },
];

export default function ProjectDetails() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Project Details</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Detailed information about your assigned project.
        </p>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-cm-text-muted">{project.id}</p>
            <h2 className="mt-1 text-2xl font-bold text-cm-text">
              {project.name}
            </h2>
            <p className="mt-2 text-sm text-cm-text-muted">
              {project.description}
            </p>
          </div>

          <Badge tone="info">{project.status}</Badge>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-cm-text-muted">Client</p>
            <p className="mt-1 text-sm font-medium text-cm-text">
              {project.client}
            </p>
          </div>
          <div>
            <p className="text-xs text-cm-text-muted">Project Lead</p>
            <p className="mt-1 text-sm font-medium text-cm-text">
              {project.lead}
            </p>
          </div>
          <div>
            <p className="text-xs text-cm-text-muted">Deadline</p>
            <p className="mt-1 text-sm font-medium text-cm-text">
              {project.deadline}
            </p>
          </div>
          <div>
            <p className="text-xs text-cm-text-muted">Technology</p>
            <p className="mt-1 text-sm font-medium text-cm-text">
              {project.technology}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-xs">
            <span className="text-cm-text-muted">Overall Progress</span>
            <span className="font-medium text-cm-text">
              {project.progress}%
            </span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-cm-border">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      </section>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-cm-text">Project Team</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {team.map((member) => (
            <div
              key={member.name}
              className="rounded-lg border border-cm-border p-4"
            >
              <p className="font-medium text-cm-text">{member.name}</p>
              <p className="mt-1 text-xs text-cm-text-muted">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-cm-text">Milestones</h2>

        <div className="mt-4 space-y-3">
          {milestones.map((milestone) => (
            <div
              key={milestone.name}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cm-border p-4"
            >
              <div>
                <p className="text-sm font-medium text-cm-text">
                  {milestone.name}
                </p>
                <p className="mt-1 text-xs text-cm-text-muted">
                  {milestone.date}
                </p>
              </div>

              <Badge
                tone={
                  milestone.status === "Completed"
                    ? "success"
                    : milestone.status === "In Progress"
                      ? "info"
                      : "warning"
                }
              >
                {milestone.status}
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
