import { FolderKanban, ListChecks, Bug, CheckCircle2 } from "lucide-react";

const stats = [
  { label: "Active Projects", value: 2 },
  { label: "Assigned Tasks", value: 8 },
  { label: "Open Bugs", value: 3 },
  { label: "Completed Projects", value: 4 },
];

const projects = [
  {
    id: "PRJ-001",
    name: "Acme Retail ERP",
    status: "In Progress",
    progress: 72,
    lead: "Rohan Mehta",
    deadline: "2026-10-15",
  },
  {
    id: "PRJ-003",
    name: "Internal HRMS",
    status: "In Progress",
    progress: 79,
    lead: "Priya Shah",
    deadline: "2026-10-25",
  },
];

const activities = [
  {
    title: "New build submitted",
    project: "Acme Retail ERP",
    time: "10 min ago",
  },
  {
    title: "Phase testing completed",
    project: "Internal HRMS",
    time: "1 hour ago",
  },
  {
    title: "Bug returned for retest",
    project: "Acme Retail ERP",
    time: "Yesterday",
  },
];

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Client Dashboard</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Overview of your projects, testing and delivery progress.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const icons = [FolderKanban, ListChecks, Bug, CheckCircle2];
          const Icon = icons[index];

          return (
            <section
              key={stat.label}
              className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
            >
              <Icon className="h-5 w-5 text-blue-600" />
              <p className="mt-4 text-sm text-cm-text-muted">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-cm-text">
                {stat.value}
              </p>
            </section>
          );
        })}
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-cm-text">My Projects</h2>

        <div className="mt-4 space-y-3">
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-lg border border-cm-border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-cm-text-muted">{project.id}</p>
                  <h3 className="mt-1 font-semibold text-cm-text">
                    {project.name}
                  </h3>
                  <p className="mt-1 text-xs text-cm-text-muted">
                    Lead: {project.lead} · Deadline: {project.deadline}
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {project.status}
                </span>
              </div>

              <div className="mt-4 h-2 rounded-full bg-cm-border">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${project.progress}%` }}
                />
              </div>

              <p className="mt-2 text-right text-xs text-cm-text-muted">
                {project.progress}% complete
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-cm-text">Recent Activity</h2>

        <div className="mt-4 space-y-3">
          {activities.map((activity) => (
            <div
              key={`${activity.title}-${activity.time}`}
              className="rounded-lg border border-cm-border p-4"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-cm-text">
                    {activity.title}
                  </p>
                  <p className="mt-1 text-xs text-cm-text-muted">
                    {activity.project}
                  </p>
                </div>
                <span className="text-xs text-cm-text-muted">
                  {activity.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
