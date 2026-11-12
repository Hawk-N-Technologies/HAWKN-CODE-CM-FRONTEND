import StatCard from "../../components/cards/StatCard";
import Badge from "../../components/common/Badge";
import AttendanceButton from "../../components/common/AttendanceButton";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      {/* Standardized BDE Dashboard Header */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-[#080d25] via-[#0b1734] to-[#1b2052] px-6 py-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-8 sm:py-8">
        {/* Decorative Background */}
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
              Business Development
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-[34px]">
              BDE Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Manage your assigned work, track activities and monitor your
              current dashboard overview.
            </p>
          </div>

          {/* Attendance */}
          <div className="relative z-10 shrink-0">
            <AttendanceButton />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned Projects" value="3" />
        <StatCard label="Testing Queue" value="8" />
        <StatCard label="Open Bugs" value="5" />
        <StatCard label="Retesting" value="3" />
      </div>

      {/* Testing Summary */}
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