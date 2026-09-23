import Badge from "../../components/common/Badge";

const phases = [
  { name: "Discovery", progress: 100, status: "Completed", tasks: "8 / 8" },
  {
    name: "Core Development",
    progress: 68,
    status: "In Progress",
    tasks: "17 / 25",
  },
  { name: "Testing", progress: 22, status: "In Progress", tasks: "3 / 14" },
  { name: "Delivery", progress: 0, status: "Not Started", tasks: "0 / 6" },
];

function ProjectProgress() {
  const average = Math.round(
    phases.reduce((sum, phase) => sum + phase.progress, 0) / phases.length,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Project Progress</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Phase-level progress and task completion overview.
        </p>
      </div>

      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-cm-text-muted">
              Overall Project Progress
            </p>
            <p className="mt-1 text-3xl font-bold text-cm-text">{average}%</p>
          </div>
          <Badge tone="info">Acme Retail ERP</Badge>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-cm-border">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${average}%` }}
          />
        </div>
      </section>

      <div className="space-y-3">
        {phases.map((phase) => (
          <section
            key={phase.name}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-cm-text">{phase.name}</h2>
                <p className="mt-1 text-xs text-cm-text-muted">
                  {phase.tasks} tasks completed
                </p>
              </div>
              <Badge
                tone={
                  phase.status === "Completed"
                    ? "success"
                    : phase.status === "In Progress"
                      ? "info"
                      : "neutral"
                }
              >
                {phase.status}
              </Badge>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-cm-border">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${phase.progress}%` }}
              />
            </div>
            <p className="mt-2 text-right text-xs text-cm-text-muted">
              {phase.progress}%
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

export default ProjectProgress;
