import Badge from "../../components/common/Badge";

const phases = [
  {
    id: "PH-001",
    name: "Discovery",
    project: "Acme Retail ERP",
    progress: 100,
    status: "Completed",
    startDate: "2026-07-01",
    endDate: "2026-07-15",
  },
  {
    id: "PH-002",
    name: "Core Development",
    project: "Acme Retail ERP",
    progress: 68,
    status: "In Progress",
    startDate: "2026-07-16",
    endDate: "2026-10-05",
  },
  {
    id: "PH-003",
    name: "Testing",
    project: "Acme Retail ERP",
    progress: 22,
    status: "In Progress",
    startDate: "2026-10-06",
    endDate: "2026-10-25",
  },
  {
    id: "PH-004",
    name: "Delivery",
    project: "Acme Retail ERP",
    progress: 0,
    status: "Not Started",
    startDate: "2026-10-26",
    endDate: "2026-11-05",
  },
];

export default function Phases() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Project Phases</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          View the progress of each project phase.
        </p>
      </div>

      <div className="space-y-3">
        {phases.map((phase) => (
          <section
            key={phase.id}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs text-cm-text-muted">{phase.id}</p>
                <h2 className="mt-1 font-semibold text-cm-text">
                  {phase.name}
                </h2>
                <p className="mt-1 text-xs text-cm-text-muted">
                  {phase.project} · {phase.startDate} to {phase.endDate}
                </p>
              </div>

              <Badge
                tone={
                  phase.status === "Completed"
                    ? "success"
                    : phase.status === "Not Started"
                      ? "neutral"
                      : "info"
                }
              >
                {phase.status}
              </Badge>
            </div>

            <div className="mt-5 h-2 rounded-full bg-cm-border">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${phase.progress}%` }}
              />
            </div>

            <p className="mt-2 text-right text-xs text-cm-text-muted">
              {phase.progress}% complete
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
