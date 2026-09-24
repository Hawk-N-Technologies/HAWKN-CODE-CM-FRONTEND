import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";
export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-cm-text">Tester Dashboard</h1>
        <p className="mt-1 text-sm text-cm-text-muted">
          Manage assigned testing work, bugs, retesting and client testing.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned Projects" value="3" />
        <StatCard label="Testing Queue" value="8" />
        <StatCard label="Open Bugs" value="5" />
        <StatCard label="Retesting" value="3" />
      </div>
      <section className="rounded-cm-lg border border-cm-border bg-cm-card p-5 shadow-sm">
        <div className="flex justify-between">
          <h2 className="text-sm font-semibold text-cm-text">
            Testing Summary
          </h2>
          <Badge tone="info">Active</Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {["Phase Testing", "Build Testing", "Client Testing"].map((x) => (
            <div key={x} className="rounded-lg border border-cm-border p-4">
              <p className="text-xs text-cm-text-muted">{x}</p>
              <p className="mt-1 font-semibold text-cm-text">Pending</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
