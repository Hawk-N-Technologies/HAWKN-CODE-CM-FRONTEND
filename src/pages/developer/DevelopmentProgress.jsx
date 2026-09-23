import Badge from "../../components/common/Badge";
const phases = [
  ["Discovery", 100, "Completed", "8 / 8"],
  ["Core Development", 68, "In Progress", "17 / 25"],
  ["Testing", 22, "In Progress", "3 / 14"],
];
export default function DevelopmentProgress() {
  const overall = Math.round(
    phases.reduce((s, p) => s + p[1], 0) / phases.length,
  );
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Development Progress</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Your development and phase progress.
        </p>
      </div>
      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-6 shadow-sm">
        <p className="text-xs text-cm-text-muted">Overall Progress</p>
        <p className="mt-1 text-3xl font-bold text-cm-text">{overall}%</p>
        <div className="mt-5 h-3 rounded-full bg-cm-border">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${overall}%` }}
          />
        </div>
      </section>
      <div className="space-y-3">
        {phases.map((p) => (
          <section
            key={p[0]}
            className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm"
          >
            <div className="flex justify-between">
              <div>
                <h2 className="font-semibold text-cm-text">{p[0]}</h2>
                <p className="text-xs text-cm-text-muted">
                  {p[3]} tasks completed
                </p>
              </div>
              <Badge tone={p[2] === "Completed" ? "success" : "info"}>
                {p[2]}
              </Badge>
            </div>
            <div className="mt-4 h-2 rounded-full bg-cm-border">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${p[1]}%` }}
              />
            </div>
            <p className="mt-2 text-right text-xs text-cm-text-muted">
              {p[1]}%
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}